const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wasteType: { type: String, enum: ['bio', 'plastic', 'e-waste', 'dry'], required: true },
  date:      { type: Date, required: true },
  timeSlot:  { type: String, required: true },
  address: {
    district:    { type: String, trim: true },
    panchayat:   { type: String, trim: true },
    ward:        { type: String, trim: true },
    houseNumber: { type: String, trim: true }
  },
  status:             { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes:              { type: String, default: '' },
  weight:             { type: Number, default: 0 },
  rewardPointsEarned: { type: Number, default: 0 }
}, { timestamps: true });

// ── Indexes ──
bookingSchema.index({ user: 1, createdAt: -1 });          // user's booking history
bookingSchema.index({ status: 1 });                        // filter by status
bookingSchema.index({ wasteType: 1 });                     // analytics by waste type
bookingSchema.index({ 'address.district': 1 });            // analytics by district
bookingSchema.index({ 'address.panchayat': 1 });           // analytics by panchayat
bookingSchema.index({ createdAt: -1 });                    // latest first sorting
bookingSchema.index({ 'address.district': 1, wasteType: 1, createdAt: -1 }); // compound for analytics

module.exports = mongoose.model('Booking', bookingSchema);
