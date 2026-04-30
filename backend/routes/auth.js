const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Reward = require('../models/Reward');
const Notification = require('../models/Notification');
const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const WELCOME_POINTS = 1250;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, district, panchayat, ward, houseNumber, role } = req.body;
    if (!name || !email || !password || !district || !panchayat || !ward || !houseNumber)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    // Create user with welcome reward points
    const user = await User.create({
      name, email, password, district, panchayat, ward, houseNumber,
      role: role || 'citizen',
      rewardPoints: WELCOME_POINTS
    });

    // Log welcome reward transaction
    await Reward.create({
      user: user._id,
      type: 'earned',
      points: WELCOME_POINTS,
      reason: '🎉 Welcome bonus for joining EcoManage'
    });

    // Send welcome notification
    await Notification.create({
      user: user._id,
      title: '🌿 Welcome to EcoManage!',
      message: `Congratulations ${name}! You've received ${WELCOME_POINTS} green points as a welcome bonus. Start booking waste pickups to earn even more!`,
      type: 'reward'
    });

    res.status(201).json({ success: true, token: generateToken(user._id), user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    res.json({ success: true, token: generateToken(user._id), user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
const { protect } = require('../middleware/auth');
router.get('/me', protect, (req, res) => res.json({ success: true, user: req.user }));

module.exports = router;
