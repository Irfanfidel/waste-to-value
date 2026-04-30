const express = require('express');
const Reward = require('../models/Reward');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { sendVoucherEmail } = require('../utils/mailer');
const router = express.Router();

const POINTS_PER_RUPEE = 5; // 5 points = ₹1

// Brand catalogue
const BRANDS = {
  movies: [
    { id: 'bookmyshow', name: 'BookMyShow', logo: '🎬', minPoints: 250 },
    { id: 'pvr', name: 'PVR Cinemas', logo: '🎥', minPoints: 250 },
    { id: 'inox', name: 'INOX', logo: '🍿', minPoints: 250 },
    { id: 'cinepolis', name: 'Cinepolis', logo: '🎞️', minPoints: 250 },
  ],
  shopping: [
    { id: 'amazon', name: 'Amazon', logo: '📦', minPoints: 500 },
    { id: 'flipkart', name: 'Flipkart', logo: '🛒', minPoints: 500 },
    { id: 'myntra', name: 'Myntra', logo: '👗', minPoints: 250 },
    { id: 'meesho', name: 'Meesho', logo: '🛍️', minPoints: 250 },
    { id: 'nykaa', name: 'Nykaa', logo: '💄', minPoints: 250 },
    { id: 'ajio', name: 'AJIO', logo: '🧥', minPoints: 250 },
  ],
  food: [
    { id: 'swiggy', name: 'Swiggy', logo: '🛵', minPoints: 150 },
    { id: 'zomato', name: 'Zomato', logo: '🍽️', minPoints: 150 },
    { id: 'dominos', name: "Domino's", logo: '🍕', minPoints: 150 },
    { id: 'pizzahut', name: 'Pizza Hut', logo: '🍕', minPoints: 150 },
    { id: 'kfc', name: 'KFC', logo: '🍗', minPoints: 150 },
  ],
  travel: [
    { id: 'makemytrip', name: 'MakeMyTrip', logo: '✈️', minPoints: 1000 },
    { id: 'redbus', name: 'RedBus', logo: '🚌', minPoints: 250 },
    { id: 'yatra', name: 'Yatra', logo: '🏨', minPoints: 500 },
    { id: 'oyo', name: 'OYO', logo: '🏩', minPoints: 500 },
  ],
};

function generateCoupon(brandId) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `ECO-${brandId.toUpperCase().slice(0, 3)}-${seg()}-${seg()}`;
}

function findBrand(brandId) {
  for (const [cat, brands] of Object.entries(BRANDS)) {
    const brand = brands.find(b => b.id === brandId);
    if (brand) return { ...brand, category: cat };
  }
  return null;
}

// GET /api/rewards/brands – Return full brand catalogue
router.get('/brands', protect, (req, res) => {
  res.json({ success: true, brands: BRANDS, pointsPerRupee: POINTS_PER_RUPEE });
});

// GET /api/rewards – My reward history + total points
router.get('/', protect, async (req, res) => {
  try {
    const rewards = await Reward.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, rewards, totalPoints: req.user.rewardPoints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rewards/voucher – Redeem points for a brand voucher
router.post('/voucher', protect, async (req, res) => {
  try {
    const { brandId, points } = req.body;
    if (!brandId || !points || points <= 0)
      return res.status(400).json({ success: false, message: 'Brand and points are required' });

    const brand = findBrand(brandId);
    if (!brand)
      return res.status(404).json({ success: false, message: 'Brand not found' });

    if (points < brand.minPoints)
      return res.status(400).json({ success: false, message: `Minimum ${brand.minPoints} points required for ${brand.name}` });

    const user = await User.findById(req.user._id);
    if (user.rewardPoints < points)
      return res.status(400).json({ success: false, message: 'Insufficient green points' });

    const rupeesValue = Math.floor(points / POINTS_PER_RUPEE);
    const couponCode = generateCoupon(brandId);

    // Deduct points
    user.rewardPoints -= points;
    await user.save();

    // Log reward transaction
    await Reward.create({
      user: user._id,
      type: 'redeemed',
      points,
      reason: `${brand.logo} ${brand.name} voucher – ₹${rupeesValue}`
    });

    // In-app notification
    await Notification.create({
      user: user._id,
      title: `${brand.logo} ${brand.name} Voucher Sent!`,
      message: `Your ₹${rupeesValue} ${brand.name} coupon code has been sent to ${user.email}. Code: ${couponCode}`,
      type: 'reward'
    });

    // Send email
    let emailPreview = null;
    try {
      const emailResult = await sendVoucherEmail({
        to: user.email,
        name: user.name,
        brandName: brand.name,
        couponCode,
        rupeesValue,
        pointsUsed: points,
        category: brand.category
      });
      emailPreview = emailResult.previewUrl;
    } catch (emailErr) {
      console.error('Email send failed (non-fatal):', emailErr.message);
    }

    res.json({
      success: true,
      voucher: { couponCode, brand: brand.name, brandLogo: brand.logo, rupeesValue, pointsUsed: points, category: brand.category },
      remainingPoints: user.rewardPoints,
      emailPreview
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rewards/redeem – Custom point redemption (legacy)
router.post('/redeem', protect, async (req, res) => {
  try {
    const { points, reason } = req.body;
    if (!points || points <= 0) return res.status(400).json({ success: false, message: 'Invalid points' });
    const user = await User.findById(req.user._id);
    if (user.rewardPoints < points) return res.status(400).json({ success: false, message: 'Insufficient points' });
    user.rewardPoints -= points;
    await user.save();
    await Reward.create({ user: user._id, type: 'redeemed', points, reason: reason || 'Points redeemed' });
    await Notification.create({ user: user._id, title: 'Points Redeemed!', message: `You successfully redeemed ${points} green points.`, type: 'reward' });
    res.json({ success: true, remainingPoints: user.rewardPoints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
