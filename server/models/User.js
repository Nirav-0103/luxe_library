const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, enum: ['admin', 'librarian', 'member'], default: 'member' },
  phone:    { type: String, trim: true },
  avatar:   { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  luxePoints: { type: Number, default: 0 },
  membershipId:        { type: String, unique: true, sparse: true },
  lastLogin:           { type: Date },
  resetPasswordToken:  { type: String },
  resetPasswordExpire: { type: Date },
  savedAddresses: [{
    label:     { type: String, default: 'Home' },
    fullName:  String,
    phone:     String,
    street:    String,
    city:      String,
    state:     String,
    pincode:   String,
    isDefault: { type: Boolean, default: false }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]
}, { timestamps: true });

// Auto-assign membershipId for members + hash password on save
userSchema.pre('save', async function (next) {
  if (this.role === 'member' && !this.membershipId) {
    const randomHex = require('crypto').randomBytes(3).toString('hex').toUpperCase();
    this.membershipId = 'LIB-' + randomHex;
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare plain password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);