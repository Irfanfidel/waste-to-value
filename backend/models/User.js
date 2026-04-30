const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 6 },
  role:        { type: String, enum: ['citizen', 'admin', 'collector'], default: 'citizen' },
  district:    { type: String, required: true, trim: true },
  panchayat:   { type: String, required: true, trim: true },
  ward:        { type: String, required: true, trim: true },
  houseNumber: { type: String, required: true, trim: true },
  rewardPoints:{ type: Number, default: 0 },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

// ── Indexes for fast lookups at scale ──
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ district: 1 });
userSchema.index({ panchayat: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
