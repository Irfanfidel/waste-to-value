const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['earned', 'redeemed'], required: true },
  points:  { type: Number, required: true },
  reason:  { type: String, required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
}, { timestamps: true });

// ── Indexes ──
rewardSchema.index({ user: 1, createdAt: -1 });
rewardSchema.index({ type: 1 });

module.exports = mongoose.model('Reward', rewardSchema);
