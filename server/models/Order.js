const mongoose = require('mongoose');
const crypto = require('crypto');

const orderItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: { type: String, required: true },
  author: { type: String },
  coverImage: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  originalAmount: { type: Number },          // Audit: pre-discount amount (for VIP orders)
  discountApplied: { type: Number, default: 0 }, // Audit: discount amount
  pointsEarned: { type: Number, default: 0 },
  pointsUsed: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cod', 'razorpay'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'refund_pending'], default: 'pending' },
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },
  refundId:          { type: String },
  refundStatus:      { type: String, enum: ['none', 'pending', 'processed', 'failed'], default: 'none' },
  refundAmount:      { type: Number },
  refundNote:        { type: String },
  refundedAt:        { type: Date },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'ready', 'completed', 'cancel_requested', 'cancelled'],
    default: 'placed'
  },
  deliveryAddress: {
    fullName: String, phone: String, street: String,
    city: String, state: String, pincode: String
  },
  cancelReason: { type: String },
  cancelRequestedAt: { type: Date },
  cancelledAt: { type: Date },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  adminNote: { type: String },
  refundRequestedByUser: { type: Boolean, default: false },
  refundRequestReason: { type: String },
  refundRequestedAt: { type: Date },
}, { timestamps: true });

// Fix #1: Race-safe order number using timestamp + random hex (no duplicate collisions)
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char hex
    this.orderNumber = `LUX-${yy}${mm}${dd}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
