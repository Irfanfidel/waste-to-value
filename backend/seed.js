require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Seeding...');

  await User.deleteMany({});
  await Booking.deleteMany({});
  await Notification.deleteMany({});

  const admin = await User.create({
    name: 'Admin Officer', email: 'admin@eco.gov', password: 'admin123',
    role: 'admin', district: 'Ernakulam', panchayat: 'Kakkanad', ward: 'Ward 1', houseNumber: 'GOVT-001'
  });

  const citizen = await User.create({
    name: 'Rajesh Kumar', email: 'citizen@test.com', password: 'test123',
    role: 'citizen', district: 'Thiruvananthapuram', panchayat: 'Kazhakkoottam', ward: 'Ward 5', houseNumber: 'TC 12/345',
    rewardPoints: 150
  });

  const booking = await Booking.create({
    user: citizen._id, wasteType: 'plastic', date: new Date(Date.now() + 86400000),
    timeSlot: '9:00 AM – 11:00 AM', status: 'confirmed',
    address: { district: citizen.district, panchayat: citizen.panchayat, ward: citizen.ward, houseNumber: citizen.houseNumber }
  });

  await Notification.create([
    { user: citizen._id, booking: booking._id, title: 'Booking Confirmed!', message: 'Your plastic waste pickup is confirmed for tomorrow.', type: 'booking' },
    { user: citizen._id, title: 'Welcome to EcoManage!', message: 'Start booking pickups to earn green reward points.', type: 'system' }
  ]);

  console.log('✅ Seed complete!');
  console.log('Admin: admin@eco.gov / admin123');
  console.log('Citizen: citizen@test.com / test123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
