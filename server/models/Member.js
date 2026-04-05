const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  membershipId: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

memberSchema.pre('save', async function(next) {
  if (!this.membershipId) {
    const count = await mongoose.model('Member').countDocuments();
    this.membershipId = `MEM${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);
