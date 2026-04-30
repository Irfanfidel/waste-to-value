const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['booking', 'pickup', 'reward', 'system'], default: 'system' },
  isRead:  { type: Boolean, default: false },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
}, { timestamps: true });

// ── Indexes ──
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });   // unread count queries

module.exports = mongoose.model('Notification', notificationSchema);
