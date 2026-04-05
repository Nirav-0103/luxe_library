const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { protect, adminOnly } = require('../middleware/auth');
const Order = require('../models/Order');
const Book  = require('../models/Book');

// ── Helper: init Razorpay instance ──────────────────────────────────────────
function getRazorpay() {
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ── GET /payment/razorpay-key  — Get Razorpay Key for Frontend ───────────────
router.get('/razorpay-key', protect, (req, res) => {
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});

// ── POST /payment/razorpay-order  — create Razorpay order ───────────────────
router.post('/razorpay-order', protect, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, message: 'Invalid amount' });

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),   // paise
      currency,
      receipt:  receipt || `lib_${Date.now()}`,
    });
    res.json({ success: true, order });
  } catch (err) {
    console.error('[Razorpay create-order]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /payment/verify  — verify signature + mark order paid ──────────────
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
// `orderId` is the MongoDB Order _id (passed from frontend after order creation)
router.post('/verify', protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,            // MongoDB order _id — optional but recommended
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }

    // 1. Verify HMAC signature
    const body            = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig     = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature mismatch. Contact support.' });
    }

    // 2. If orderId provided, stamp payment IDs on the DB order
    if (orderId) {
      const order = await Order.findByIdAndUpdate(orderId, {
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus:     'paid',
      }, { new: true });
      
      // Award Luxe Points for online payment success
      if (order && order.pointsEarned > 0) {
        const User = require('../models/User');
        await User.findByIdAndUpdate(order.user, { $inc: { luxePoints: order.pointsEarned } });
      }
    }

    res.json({ success: true, message: 'Payment verified!', paymentId: razorpay_payment_id });
  } catch (err) {
    console.error('[Razorpay verify]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── POST /payment/refund  — initiate refund (admin) ─────────────────────────
// Body: { orderId, amount (optional — full refund if omitted), note }
router.post('/refund', protect, adminOnly, async (req, res) => {
  try {
    const { orderId, amount, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (!order.razorpayPaymentId)
      return res.status(400).json({ success: false, message: 'No Razorpay payment ID on this order — cannot refund.' });

    if (order.paymentStatus === 'refunded')
      return res.status(400).json({ success: false, message: 'This order has already been refunded.' });

    const refundAmount   = amount ? Math.round(amount * 100) : Math.round(order.totalAmount * 100);
    const razorpay       = getRazorpay();

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: refundAmount,
      notes: { reason: note || 'Refund by admin', orderId: orderId.toString() },
    });

    // Update order
    order.paymentStatus = 'refunded';
    order.refundId      = refund.id;
    order.refundStatus  = 'processed';
    order.refundAmount  = refundAmount / 100;
    order.refundNote    = note || '';
    order.refundedAt    = new Date();

    // Fix #6: Restore inventory when refunding + cancelling
    if (order.orderStatus !== 'cancelled') {
      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      // Restore book copies that were deducted at order creation
      for (const item of order.items) {
        await Book.findByIdAndUpdate(item.book, { $inc: { availableCopies: item.quantity || 1 } });
      }
      
      const User = require('../models/User');
      // Restore points user spent
      if (order.pointsUsed > 0) {
        await User.findByIdAndUpdate(order.user, { $inc: { luxePoints: order.pointsUsed } });
      }
      // Revert points user earned
      if (order.pointsEarned > 0) {
        await User.findByIdAndUpdate(order.user, { $inc: { luxePoints: -order.pointsEarned } });
      }
    }
    await order.save();

    res.json({ success: true, message: `Refund of ₹${refundAmount / 100} initiated!`, refund });
  } catch (err) {
    console.error('[Razorpay refund]', err.message);
    // Mark refund as failed if Razorpay threw
    if (req.body.orderId) {
      await Order.findByIdAndUpdate(req.body.orderId, {
        refundStatus: 'failed',
        refundNote:   err.message,
      }).catch(() => {});
    }
    res.status(500).json({ success: false, message: err.error?.description || err.message });
  }
});

// ── GET /payment/refunds  — list all refunded orders (admin) ─────────────────
router.get('/refunds', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { paymentStatus: { $in: ['refunded', 'refund_pending'] } },
        { refundStatus: { $in: ['processed', 'pending', 'failed'] } },
      ],
    })
      .populate('user', 'name email')
      .populate('items.book', 'title')
      .sort({ refundedAt: -1, updatedAt: -1 })
      .lean();

    res.json({ success: true, data: orders, count: orders.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
