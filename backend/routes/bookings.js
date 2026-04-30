const express = require('express');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const router = express.Router();

// POST /api/bookings – Create booking
router.post('/', protect, async (req, res) => {
  try {
    const { wasteType, date, timeSlot, notes } = req.body;
    if (!wasteType || !date || !timeSlot)
      return res.status(400).json({ success: false, message: 'Waste type, date, and time slot required' });

    const booking = await Booking.create({
      user: req.user._id,
      wasteType, date, timeSlot, notes,
      address: { district: req.user.district, panchayat: req.user.panchayat, ward: req.user.ward, houseNumber: req.user.houseNumber },
      status: 'confirmed'
    });

    await Notification.create({
      user: req.user._id, booking: booking._id,
      title: 'Booking Confirmed!',
      message: `Your ${wasteType} waste pickup is confirmed for ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
      type: 'booking'
    });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings – Get my bookings
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status === 'completed') return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });

    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
