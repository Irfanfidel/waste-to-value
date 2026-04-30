/**
 * EcoManage — Rich Demo Data Seeder
 * Generates 6 months of realistic data for application review
 * Run: node seed-demo.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// ── Kerala-specific data ───────────────────────────────────────────────────
const KERALA_DATA = [
  { district: 'Thiruvananthapuram', panchayats: ['Kazhakkoottam', 'Vattiyoorkavu', 'Nemom', 'Parassala', 'Attingal', 'Nedumangad'] },
  { district: 'Kollam',             panchayats: ['Kottarakkara', 'Punalur', 'Karunagappally', 'Chavara', 'Kundara'] },
  { district: 'Pathanamthitta',     panchayats: ['Adoor', 'Thiruvalla', 'Ranni', 'Konni', 'Pandalam'] },
  { district: 'Alappuzha',          panchayats: ['Cherthala', 'Haripad', 'Kayamkulam', 'Mavelikkara', 'Ambalappuzha'] },
  { district: 'Kottayam',           panchayats: ['Kanjirappally', 'Pala', 'Changanassery', 'Vaikom', 'Ettumanoor'] },
  { district: 'Ernakulam',          panchayats: ['Kakkanad', 'Perumbavoor', 'Muvattupuzha', 'Aluva', 'Kothamangalam', 'Thrikkakara'] },
  { district: 'Thrissur',           panchayats: ['Chalakudy', 'Kunnamkulam', 'Kodungallur', 'Irinjalakuda', 'Mala'] },
  { district: 'Palakkad',           panchayats: ['Ottapalam', 'Shoranur', 'Mannarkkad', 'Pattambi', 'Cherpulassery'] },
  { district: 'Malappuram',         panchayats: ['Tirur', 'Perinthalmanna', 'Manjeri', 'Nilambur', 'Ponnani'] },
  { district: 'Kozhikode',          panchayats: ['Vatakara', 'Koyilandy', 'Ramanattukara', 'Feroke', 'Balussery'] },
  { district: 'Wayanad',            panchayats: ['Mananthavady', 'Sulthan Bathery', 'Kalpetta', 'Vythiri', 'Panamaram'] },
  { district: 'Kannur',             panchayats: ['Thalassery', 'Iritty', 'Payyanur', 'Sreekandapuram', 'Mattannur'] },
  { district: 'Kasaragod',          panchayats: ['Kanhangad', 'Nileshwar', 'Cheruvathur', 'Hosdurg', 'Bekal'] },
];

const MALE_NAMES = [
  'Rajesh Kumar', 'Arun Nair', 'Suresh Pillai', 'Manoj Menon', 'Sreejith R',
  'Pradeep KV', 'Vinod Thomas', 'Biju Mathew', 'Santhosh PM', 'Ajith Kumar',
  'Deepak Raj', 'Anoop MK', 'Rahul Krishnan', 'Sijo Joseph', 'Nithesh Babu',
  'Vishnu Prasad', 'Jishnu KR', 'Amal Dev', 'Rohit Nair', 'Praveen S',
  'Gireesh Kumar', 'Midhun MP', 'Aravind RK', 'Noufal PP', 'Sarath Babu',
];
const FEMALE_NAMES = [
  'Priya Nair', 'Anjali Menon', 'Divya KR', 'Reshma Thomas', 'Meera S',
  'Lakshmi PM', 'Sruthi Raj', 'Anu Mathew', 'Sindhu PK', 'Nisha MV',
  'Kavya Krishnan', 'Sreelakshmi R', 'Parvathy KN', 'Athira Suresh', 'Riya Jose',
  'Gayathri MR', 'Neethu RK', 'Amrutha SP', 'Jyothi Pillai', 'Reena KV',
];
const ALL_NAMES = [...MALE_NAMES, ...FEMALE_NAMES];

const WASTE_TYPES   = ['bio', 'plastic', 'e-waste', 'dry'];
const WASTE_WEIGHTS = [0.45, 0.30, 0.10, 0.15]; // probability weights
const TIME_SLOTS    = [
  '7:00 AM – 9:00 AM',
  '9:00 AM – 11:00 AM',
  '11:00 AM – 1:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
];
const BOOKING_STATUSES = ['completed', 'completed', 'completed', 'confirmed', 'cancelled']; // weighted
const POINTS_MAP = { bio: 50, plastic: 40, 'e-waste': 80, dry: 30 };

// ── Helpers ────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickWeighted(arr, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) { r -= weights[i]; if (r <= 0) return arr[i]; }
  return arr[arr.length - 1];
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomEmail(name) {
  const clean = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];
  return `${clean}${randInt(10, 999)}@${pick(domains)}`;
}
function pastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randInt(0, 23), randInt(0, 59), randInt(0, 59));
  return d;
}

// ── Main Seeder ────────────────────────────────────────────────────────────
async function seed() {
  // Start embedded MongoDB
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  console.log('🔄 Connecting to embedded MongoDB…');
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create({
    instance: { dbPath: dataDir, storageEngine: 'wiredTiger' }
  });
  await mongoose.connect(mongod.getUri(), { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected');

  const User         = require('./models/User');
  const Booking      = require('./models/Booking');
  const Reward       = require('./models/Reward');
  const Notification = require('./models/Notification');

  // Clear existing data (except admin)
  const admin = await User.findOne({ email: 'admin@eco.gov' });
  await Booking.deleteMany({});
  await Reward.deleteMany({});
  await Notification.deleteMany({});
  await User.deleteMany({ role: { $ne: 'admin' } });
  console.log('🗑️  Cleared old citizen data');

  // Ensure admin exists
  if (!admin) {
    await User.create({
      name: 'Admin Officer', email: 'admin@eco.gov', password: 'admin123',
      role: 'admin', district: 'Ernakulam', panchayat: 'Kakkanad',
      ward: 'Ward 1', houseNumber: 'GOVT-001',
    });
    console.log('👤 Admin account created');
  }

  // ── Create 50 citizens ────────────────────────────────────────────────
  console.log('\n👥 Creating 50 citizens…');
  const citizens = [];
  const usedNames = new Set();

  for (let i = 0; i < 50; i++) {
    let name;
    do { name = pick(ALL_NAMES); } while (usedNames.has(name) && usedNames.size < ALL_NAMES.length);
    usedNames.add(name);

    const loc     = pick(KERALA_DATA);
    const panch   = pick(loc.panchayats);
    const joinedDaysAgo = randInt(10, 180); // joined in last 6 months

    const user = await User.create({
      name,
      email:        randomEmail(name),
      password:     'citizen123',
      role:         'citizen',
      district:     loc.district,
      panchayat:    panch,
      ward:         `Ward ${randInt(1, 20)}`,
      houseNumber:  `TC ${randInt(1, 99)}/${randInt(100, 999)}`,
      rewardPoints: 0,
      createdAt:    pastDate(joinedDaysAgo),
    });
    citizens.push(user);
    process.stdout.write(`\r   ${i + 1}/50 created`);
  }
  console.log('\n✅ 50 citizens created');

  // ── Create bookings (3–8 per citizen, past 6 months) ─────────────────
  console.log('\n📋 Creating bookings…');
  let totalBookings = 0, totalCompleted = 0;

  for (const citizen of citizens) {
    const numBookings = randInt(3, 8);
    const joinedDaysAgo = Math.floor((Date.now() - citizen.createdAt) / 86400000);

    for (let b = 0; b < numBookings; b++) {
      const daysAgo   = randInt(1, Math.min(joinedDaysAgo, 180));
      const bookDate  = pastDate(daysAgo);
      const wasteType = pickWeighted(WASTE_TYPES, WASTE_WEIGHTS);
      const status    = daysAgo > 3 ? pick(BOOKING_STATUSES) : 'confirmed';
      const pts       = status === 'completed' ? POINTS_MAP[wasteType] : 0;

      const booking = await Booking.create({
        user:               citizen._id,
        wasteType,
        date:               bookDate,
        timeSlot:           pick(TIME_SLOTS),
        status,
        rewardPointsEarned: pts,
        address: {
          district:    citizen.district,
          panchayat:   citizen.panchayat,
          ward:        citizen.ward,
          houseNumber: citizen.houseNumber,
        },
        createdAt: bookDate,
      });

      totalBookings++;
      if (status === 'completed') {
        totalCompleted++;

        // Add reward
        await Reward.create({
          user:      citizen._id,
          booking:   booking._id,
          type:      'earned',
          points:    pts,
          reason:    `Pickup completed — ${wasteType} waste`,
          createdAt: bookDate,
        });

        // Update citizen points
        await User.findByIdAndUpdate(citizen._id, { $inc: { rewardPoints: pts } });

        // Completion notification
        await Notification.create({
          user:      citizen._id,
          booking:   booking._id,
          title:     'Pickup Completed! ✅',
          message:   `Great job! You earned ${pts} green points for your ${wasteType} waste pickup.`,
          type:      'reward',
          isRead:    Math.random() > 0.3,
          createdAt: bookDate,
        });

      } else if (status === 'confirmed') {
        // Booking confirmed notification
        await Notification.create({
          user:      citizen._id,
          booking:   booking._id,
          title:     'Booking Confirmed! 📅',
          message:   `Your ${wasteType} waste pickup has been confirmed for ${bookDate.toLocaleDateString('en-IN')} at ${pick(TIME_SLOTS)}.`,
          type:      'booking',
          isRead:    Math.random() > 0.4,
          createdAt: bookDate,
        });
      }
    }

    // Welcome bonus (only for citizens with ≥1 booking)
    const welcomePts = randInt(100, 500);
    await Reward.create({
      user:      citizen._id,
      type:      'earned',
      points:    welcomePts,
      reason:    '🎉 Welcome bonus for joining EcoManage',
      createdAt: citizen.createdAt,
    });
    await User.findByIdAndUpdate(citizen._id, { $inc: { rewardPoints: welcomePts } });

    // Welcome notification
    await Notification.create({
      user:      citizen._id,
      title:     'Welcome to EcoManage! 🌿',
      message:   `Welcome ${citizen.name.split(' ')[0]}! You've received ${welcomePts} green points as a welcome bonus.`,
      type:      'system',
      isRead:    true,
      createdAt: citizen.createdAt,
    });

    process.stdout.write(`\r   Processed ${citizens.indexOf(citizen) + 1}/50 citizens`);
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const userCount    = await User.countDocuments();
  const bookingCount = await Booking.countDocuments();
  const rewardCount  = await Reward.countDocuments();
  const notifCount   = await Notification.countDocuments();

  console.log('\n\n✅ ═══════════════════════════════════════');
  console.log('   SEED COMPLETE — 6 Month Dataset');
  console.log('   ═══════════════════════════════════════');
  console.log(`   👥 Users:          ${userCount} (1 admin + 50 citizens)`);
  console.log(`   📋 Bookings:       ${bookingCount} (${totalCompleted} completed)`);
  console.log(`   🏆 Rewards:        ${rewardCount} transactions`);
  console.log(`   🔔 Notifications:  ${notifCount}`);
  console.log('   ───────────────────────────────────────');
  console.log('   👤 Admin:   admin@eco.gov   / admin123');
  console.log('   👤 Citizen: any citizen     / citizen123');
  console.log('   ═══════════════════════════════════════\n');

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
