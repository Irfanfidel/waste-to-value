const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Reward = require('../models/Reward');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────
const wasteColors = { bio: '#22c55e', plastic: '#3b82f6', 'e-waste': '#f59e0b', dry: '#a78bfa' };

function periodToDate(period) {
  const now = new Date();
  switch (period) {
    case 'lastMonth':   return new Date(now.getFullYear(), now.getMonth() - 1,  now.getDate());
    case 'last3Months': return new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate());
    case 'last6Months': return new Date(now.getFullYear(), now.getMonth() - 6,  now.getDate());
    case 'lastYear':    return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:            return null; // allTime
  }
}

// GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalBookings, completedBookings, rewards] = await Promise.all([
      User.countDocuments({ role: 'citizen' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Reward.aggregate([{ $match: { type: 'earned' } }, { $group: { _id: null, total: { $sum: '$points' } } }])
    ]);
    const wasteBreakdown = await Booking.aggregate([
      { $group: { _id: '$wasteType', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, stats: { totalUsers, totalBookings, completedBookings, totalPointsAwarded: rewards[0]?.total || 0, wasteBreakdown } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/analytics?period=lastMonth&district=&panchayat=
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const { period = 'allTime', district = '', panchayat = '' } = req.query;
    const fromDate = periodToDate(period);

    // Build base match
    const baseMatch = {};
    if (fromDate) baseMatch.createdAt = { $gte: fromDate };
    if (district)  baseMatch['address.district']  = district;
    if (panchayat) baseMatch['address.panchayat'] = panchayat;

    // 1. Waste type totals for the period
    const wasteByType = await Booking.aggregate([
      { $match: { ...baseMatch } },
      { $group: { _id: '$wasteType', count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
      { $sort: { count: -1 } }
    ]);

    // 2. Monthly trend – last 12 months, broken by waste type
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    const trend = await Booking.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo }, ...(district ? { 'address.district': district } : {}), ...(panchayat ? { 'address.panchayat': panchayat } : {}) } },
      { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, wasteType: '$wasteType' },
          count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 3. District-wise breakdown
    const districtBreakdown = await Booking.aggregate([
      { $match: { ...(fromDate ? { createdAt: { $gte: fromDate } } : {}) } },
      { $group: { _id: { district: '$address.district', wasteType: '$wasteType' }, count: { $sum: 1 } } },
      { $group: {
          _id: '$_id.district',
          total: { $sum: '$count' },
          types: { $push: { type: '$_id.wasteType', count: '$count' } }
      }},
      { $sort: { total: -1 } }
    ]);

    // 4. Panchayat breakdown (filtered by selected district or all)
    const panchayatMatch = fromDate ? { createdAt: { $gte: fromDate } } : {};
    if (district) panchayatMatch['address.district'] = district;
    const panchayatBreakdown = await Booking.aggregate([
      { $match: panchayatMatch },
      { $group: {
          _id: { panchayat: '$address.panchayat', district: '$address.district', wasteType: '$wasteType' },
          count: { $sum: 1 }
      }},
      { $group: {
          _id: { panchayat: '$_id.panchayat', district: '$_id.district' },
          total: { $sum: '$count' },
          types: { $push: { type: '$_id.wasteType', count: '$count' } }
      }},
      { $sort: { total: -1 } },
      { $limit: 20 }
    ]);

    // 5. Summary totals
    const totalCollected = wasteByType.reduce((s, w) => s + w.count, 0);
    const totalCompleted = wasteByType.reduce((s, w) => s + w.completed, 0);

    // List of distinct districts for filter dropdown
    const districts = await Booking.distinct('address.district');
    const panchayats = district
      ? await Booking.distinct('address.panchayat', { 'address.district': district })
      : [];

    res.json({
      success: true,
      analytics: {
        period, fromDate,
        totalCollected, totalCompleted,
        wasteByType, trend,
        districtBreakdown, panchayatBreakdown,
        districts, panchayats, wasteColors
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/bookings
router.get('/bookings', protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user', 'name email district ward').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/bookings/:id/complete
router.patch('/bookings/:id/complete', protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    booking.status = 'completed';
    const pts = { bio: 50, plastic: 75, 'e-waste': 100, dry: 40 }[booking.wasteType] || 50;
    booking.rewardPointsEarned = pts;
    await booking.save();
    await User.findByIdAndUpdate(booking.user._id, { $inc: { rewardPoints: pts } });
    await Reward.create({ user: booking.user._id, booking: booking._id, type: 'earned', points: pts, reason: `Pickup completed for ${booking.wasteType} waste` });
    await Notification.create({ user: booking.user._id, booking: booking._id, title: 'Pickup Completed!', message: `Great job! You earned ${pts} green points for your ${booking.wasteType} waste pickup.`, type: 'reward' });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'citizen' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/database?collection=users&search=&page=1&limit=50
router.get('/database', protect, adminOnly, async (req, res) => {
  try {
    const { collection = 'users', search = '', page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const lim  = parseInt(limit);

    let data = [], total = 0;

    if (collection === 'users') {
      const q = search ? {
        $or: [
          { name:      { $regex: search, $options: 'i' } },
          { email:     { $regex: search, $options: 'i' } },
          { district:  { $regex: search, $options: 'i' } },
          { panchayat: { $regex: search, $options: 'i' } },
          { role:      { $regex: search, $options: 'i' } },
        ]
      } : {};
      total = await User.countDocuments(q);
      data  = await User.find(q).select('-password').sort({ createdAt: -1 }).skip(skip).limit(lim);

    } else if (collection === 'bookings') {
      const q = search ? {
        $or: [
          { wasteType: { $regex: search, $options: 'i' } },
          { status:    { $regex: search, $options: 'i' } },
          { 'address.district':  { $regex: search, $options: 'i' } },
          { 'address.panchayat': { $regex: search, $options: 'i' } },
        ]
      } : {};
      total = await Booking.countDocuments(q);
      data  = await Booking.find(q).populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(lim);

    } else if (collection === 'rewards') {
      const q = search ? { reason: { $regex: search, $options: 'i' } } : {};
      total = await Reward.countDocuments(q);
      data  = await Reward.find(q).populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(lim);

    } else if (collection === 'wasteCollected') {
      const q = search ? {
        $or: [
          { wasteType:           { $regex: search, $options: 'i' } },
          { status:              { $regex: search, $options: 'i' } },
          { 'address.district':  { $regex: search, $options: 'i' } },
          { 'address.panchayat': { $regex: search, $options: 'i' } },
        ]
      } : {};
      // Only completed pickups count as "collected"
      total = await Booking.countDocuments({ ...q });
      data  = await Booking.find({ ...q })
        .populate('user', 'name email district panchayat')
        .sort({ createdAt: -1 }).skip(skip).limit(lim);

    } else if (collection === 'notifications') {
      const q = search ? {
        $or: [
          { title:   { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } },
          { type:    { $regex: search, $options: 'i' } },
        ]
      } : {};
      total = await Notification.countDocuments(q);
      data  = await Notification.find(q).populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(lim);
    }

    // Collection counts summary
    const counts = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Reward.countDocuments(),
      Notification.countDocuments(),
      Booking.countDocuments(), // wasteCollected = all bookings
    ]);

    res.json({
      success: true,
      collection, data, total,
      page: parseInt(page), limit: lim,
      totalPages: Math.ceil(total / lim),
      counts: {
        users: counts[0],
        bookings: counts[1],
        rewards: counts[2],
        notifications: counts[3],
        wasteCollected: counts[4]
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
