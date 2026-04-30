const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes         = require('./routes/auth');
const bookingRoutes      = require('./routes/bookings');
const adminRoutes        = require('./routes/admin');
const rewardRoutes       = require('./routes/rewards');
const notificationRoutes = require('./routes/notifications');

const path = require('path');
const fs   = require('fs');

const app = express();

// CORS — allow all origins (Vercel + mobile PWA)
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// API routes
app.use('/api/auth',          authRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/rewards',       rewardRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'EcoManage API running', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
);

// Serve React frontend (Render / Electron / local production)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = process.env.FRONTEND_DIST
    || path.join(__dirname, 'public')
    || path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
    console.log('📦 Serving frontend from:', frontendPath);
  }
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ── MongoDB connection ──────────────────────────────────────────────────────
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS:          45000,
  maxPoolSize:              10,
  retryWrites:              true,
};

let isConnected = false;

async function connectDB() {
  if (isConnected) return;        // Reuse connection in serverless
  const uri = process.env.MONGODB_URI || '';
  const isLocalhost = !uri || uri.includes('localhost') || uri.includes('127.0.0.1');

  if (isLocalhost) {
    const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    console.log('🔄 Starting embedded MongoDB…', dataDir);
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({
      instance: { dbPath: dataDir, storageEngine: 'wiredTiger' }
    });
    await mongoose.connect(mongod.getUri(), MONGO_OPTIONS);
    console.log('✅ Embedded MongoDB ready');

    const User = require('./models/User');
    const existing = await User.findOne({ email: 'admin@eco.gov' });
    if (!existing) await seedDemoData();
    else console.log('✅ Existing data loaded');
  } else {
    console.log('🌐 Connecting to MongoDB Atlas…');
    await mongoose.connect(uri, MONGO_OPTIONS);
    console.log('✅ MongoDB Atlas connected');

    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin@eco.gov' });
    if (!adminExists) {
      await User.create({
        name: 'Admin Officer', email: 'admin@eco.gov', password: 'admin123',
        role: 'admin', district: 'Ernakulam', panchayat: 'Kakkanad',
        ward: 'Ward 1', houseNumber: 'GOVT-001'
      });
      console.log('✅ Admin account seeded: admin@eco.gov / admin123');
    }
  }
  isConnected = true;
}

// ── Demo data seeder ───────────────────────────────────────────────────────
async function seedDemoData() {
  const User         = require('./models/User');
  const Booking      = require('./models/Booking');
  const Notification = require('./models/Notification');
  const Reward       = require('./models/Reward');

  await User.create({ name: 'Admin Officer', email: 'admin@eco.gov', password: 'admin123', role: 'admin', district: 'Ernakulam', panchayat: 'Kakkanad', ward: 'Ward 1', houseNumber: 'GOVT-001' });
  const citizen = await User.create({ name: 'Rajesh Kumar', email: 'citizen@test.com', password: 'test123', role: 'citizen', district: 'Thiruvananthapuram', panchayat: 'Kazhakkoottam', ward: 'Ward 5', houseNumber: 'TC 12/345', rewardPoints: 1250 });

  const tomorrow = new Date(Date.now() + 86400000);
  const past     = new Date(Date.now() - 3 * 86400000);
  const b1 = await Booking.create({ user: citizen._id, wasteType: 'plastic', date: tomorrow, timeSlot: '9:00 AM – 11:00 AM', status: 'confirmed', address: { district: citizen.district, panchayat: citizen.panchayat, ward: citizen.ward, houseNumber: citizen.houseNumber } });
  const b2 = await Booking.create({ user: citizen._id, wasteType: 'bio', date: past, timeSlot: '7:00 AM – 9:00 AM', status: 'completed', rewardPointsEarned: 50, address: { district: citizen.district, panchayat: citizen.panchayat, ward: citizen.ward, houseNumber: citizen.houseNumber } });

  await Reward.create([
    { user: citizen._id, booking: b2._id, type: 'earned', points: 50, reason: 'Pickup completed for bio waste' },
    { user: citizen._id, type: 'earned', points: 1250, reason: '🎉 Welcome bonus for joining EcoManage' }
  ]);
  await Notification.create([
    { user: citizen._id, booking: b1._id, title: 'Booking Confirmed! 📅', message: 'Your plastic waste pickup is confirmed for tomorrow.', type: 'booking' },
    { user: citizen._id, booking: b2._id, title: 'Pickup Completed! ✅', message: 'You earned 50 green points for your bio waste pickup.', type: 'reward' },
    { user: citizen._id, title: 'Welcome to EcoManage! 🌿', message: 'Start booking pickups to earn green reward points.', type: 'system' }
  ]);
  console.log('✅ Demo data seeded — admin@eco.gov / admin123 | citizen@test.com / test123');
}

// Export for Vercel (serverless) — connectDB called per request
app.use(async (req, res, next) => { try { await connectDB(); next(); } catch (e) { res.status(500).json({ error: 'DB connection failed' }); } });

// ── Start normally for local / Render ─────────────────────────────────────
if (require.main === module) {
  connectDB().then(() => {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`\n🚀 EcoManage → http://localhost:${PORT}`);
      console.log(`📋 Health    → http://localhost:${PORT}/api/health\n`);
    });
  }).catch(err => { console.error('❌ Startup error:', err); process.exit(1); });
}

module.exports = app;   // Vercel uses this export
