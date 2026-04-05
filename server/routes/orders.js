const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Book = require('../models/Book');
const { Parser } = require('json2csv');
const { protect, adminOnly } = require('../middleware/auth');
const { sendOrderConfirmation, sendOrderStatusEmail } = require('../utils/emailService');

// ── Valid order status transitions (Fix #12: Server-side state machine) ──
const VALID_TRANSITIONS = {
  placed:           ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['ready'],
  ready:            ['completed'],
  cancel_requested: ['cancelled', 'confirmed'],
  // completed and cancelled are terminal — no further transitions
};

// ── Helper: Validate stock and atomically decrement ──
async function decrementStock(items) {
  const results = [];
  for (const item of items) {
    const qty = item.quantity || 1;
    // Fix #3/#11: Atomic check-and-decrement — only succeeds if enough stock
    const updated = await Book.findOneAndUpdate(
      { _id: item.book, availableCopies: { $gte: qty } },
      { $inc: { availableCopies: -qty } },
      { new: true }
    );
    if (!updated) {
      // Rollback any already-decremented books
      for (const prev of results) {
        await Book.findByIdAndUpdate(prev.bookId, { $inc: { availableCopies: prev.qty } });
      }
      const failedBook = await Book.findById(item.book);
      const title = failedBook?.title || 'Unknown book';
      const avail = failedBook?.availableCopies || 0;
      throw new Error(`"${title}" has only ${avail} copies available (requested ${qty})`);
    }
    results.push({ bookId: item.book, qty });
  }
  return results;
}

// ── Helper: Restore stock on cancellation ──
async function restoreStock(items) {
  for (const item of items) {
    await Book.findByIdAndUpdate(item.book, { $inc: { availableCopies: item.quantity || 1 } });
  }
}

// ── Helper: Recalculate total from DB book prices (Fix #7/#8) ──
async function recalculateTotal(items) {
  let total = 0;
  const validatedItems = [];
  for (const item of items) {
    const book = await Book.findById(item.book);
    if (!book) throw new Error(`Book not found: ${item.book}`);
    const serverPrice = book.price || 0;
    const qty = Math.max(1, Math.min(item.quantity || 1, 10)); // cap quantity 1-10
    validatedItems.push({
      book: book._id,
      title: book.title,
      author: book.author,
      coverImage: book.coverImage || '',
      price: serverPrice,       // Use server-verified price, not client price
      quantity: qty,
    });
    total += serverPrice * qty;
  }
  return { validatedItems, total };
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN routes FIRST (Fix #5: Specific routes before /:id param route)
// ══════════════════════════════════════════════════════════════════════════════

// ── ADMIN: Get All Orders ──
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 50 } = req.query; // Fix #27: Support paymentStatus filter, Fix #26: Pagination
    let query = {};
    if (status && status !== 'all') query.orderStatus = status;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;
    
    // Convert to integers
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    // Get total count for pagination
    const totalCount = await Order.countDocuments(query);
    
    const orders = await Order.find(query)
      .populate('user', 'name email membershipId')
      .populate('items.book', 'title author coverImage')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
      
    res.json({ 
      success: true, 
      data: orders, 
      count: orders.length, 
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Export Orders as CSV ──
router.get('/admin/export/csv', protect, adminOnly, async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;
    let query = {};
    if (status && status !== 'all') query.orderStatus = status;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('user', 'name email membershipId')
      .populate('items.book', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const csvData = orders.map(o => ({
      'Order Number': o.orderNumber,
      'Date': new Date(o.createdAt).toLocaleDateString('en-IN'),
      'Customer Name': o.user?.name || 'Unknown',
      'Email': o.user?.email || 'Unknown',
      'Items Co.': o.items.reduce((s, i) => s + (i.quantity || 1), 0),
      'Book Titles': o.items.map(i => i.title || (i.book && i.book.title) || 'Unknown').join('; '),
      'Total Amount': o.totalAmount,
      'Points Used': o.pointsUsed || 0,
      'Grand Total': o.totalAmount, // Assuming totalAmount is what customer paid
      'Payment Method': o.paymentMethod.toUpperCase(),
      'Payment Status': o.paymentStatus.toUpperCase(),
      'Order Status': o.orderStatus.replace('_', ' ').toUpperCase()
    }));

    const fields = ['Order Number', 'Date', 'Customer Name', 'Email', 'Items Co.', 'Book Titles', 'Total Amount', 'Points Used', 'Grand Total', 'Payment Method', 'Payment Status', 'Order Status'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment(`orders_export_${new Date().getTime()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Get Stats ──
router.get('/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const placed = await Order.countDocuments({ orderStatus: 'placed' });
    const confirmed = await Order.countDocuments({ orderStatus: 'confirmed' });
    const completed = await Order.countDocuments({ orderStatus: 'completed' });
    const cancelled = await Order.countDocuments({ orderStatus: 'cancelled' });
    const cancelRequested = await Order.countDocuments({ orderStatus: 'cancel_requested' });
    const revenue = await Order.aggregate([
      { $match: { 
          paymentStatus: 'paid',
          orderStatus: { $in: ['confirmed', 'processing', 'ready', 'completed'] }
      } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    res.json({
      success: true,
      data: { total, placed, confirmed, completed, cancelled, cancelRequested, revenue: revenue[0]?.total || 0 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Update Order Status ──
router.put('/admin/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Fix #12: Validate state transition
    const current = order.orderStatus;
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order from "${current}" to "${status}". Allowed: ${(allowed || ['none']).join(', ')}`
      });
    }

    // Fix #13: Guard against double-cancel (only restore stock if not already cancelled)
    if (status === 'cancelled' && current !== 'cancelled') {
      order.cancelledAt = new Date();
      // Restore book copies
      await restoreStock(order.items);
      
      const User = require('../models/User');
      // Restore points user spent on this cancelled order
      if (order.pointsUsed > 0) {
        await User.findByIdAndUpdate(order.user, { $inc: { luxePoints: order.pointsUsed } });
      }
      // Revert points user earned if they had already paid
      if (order.paymentStatus === 'paid' && order.pointsEarned > 0) {
        await User.findByIdAndUpdate(order.user, { $inc: { luxePoints: -order.pointsEarned } });
      }
    }

    order.orderStatus = status;
    if (adminNote) order.adminNote = adminNote;

    if (status === 'confirmed') order.confirmedAt = new Date();
    if (status === 'completed') {
      order.completedAt = new Date();
      // Auto-mark payment as paid when order is completed for COD
      if (order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
        // Award points now since payment is received!
        if (order.pointsEarned > 0) {
          const User = require('../models/User');
          await User.findByIdAndUpdate(order.user, { $inc: { luxePoints: order.pointsEarned } });
        }
      }
    }
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('user', 'name email membershipId')
      .populate('items.book', 'title author');

    // Send email notification for important status transitions
    if (['confirmed', 'ready', 'cancelled'].includes(status)) {
      sendOrderStatusEmail(populated.user, populated).catch(e => console.log('Status email skipped:', e.message));
    }

    res.json({ success: true, data: populated, message: `Order ${status}!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// USER routes
// ══════════════════════════════════════════════════════════════════════════════

// ── USER: Create Order ──
router.post('/', protect, async (req, res) => {
  try {
    const { items, paymentMethod, deliveryAddress, pointsToUse = 0 } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'No items in order' });

    // Fix #7/#8: Recalculate total from actual DB prices — ignore client totalAmount
    const { validatedItems, total: serverTotal } = await recalculateTotal(items);

    // Fix #14: VIP discount audit & VIP Limits (Phase 3)
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const originalAmount = serverTotal;
    let discountApplied = 0;

    let finalTotal = serverTotal - discountApplied;

    // Phase 2: Luxe Points Logic
    let actualPointsUsed = 0;
    if (pointsToUse > 0) {
      if (user.luxePoints < pointsToUse) {
        return res.status(400).json({ success: false, message: 'Not enough Luxe Points.' });
      }
      // Cannot use more points than the grand total
      actualPointsUsed = Math.min(pointsToUse, finalTotal);
      finalTotal -= actualPointsUsed;
    }

    // Earn 1 point per 10 rupees spent
    const pointsEarned = Math.floor(finalTotal / 10);

    // Fix #3: Validate stock atomically before creating order
    await decrementStock(validatedItems);

    // Fix #4: Always set paymentStatus to 'pending' on creation — only verify endpoint marks 'paid'
    const order = await Order.create({
      user: req.user._id,
      items: validatedItems,
      totalAmount: finalTotal,
      originalAmount,
      discountApplied,
      pointsUsed: actualPointsUsed,
      pointsEarned,
      paymentMethod,
      paymentStatus: 'pending',
      deliveryAddress,
    });

    // Deduct points immediately if used. Earning happens on payment success or completion.
    if (actualPointsUsed > 0) {
      user.luxePoints -= actualPointsUsed;
      await user.save();
    }

    // Send confirmation email in background to prevent slow COD checkout
    if (user) {
      sendOrderConfirmation(user, order).catch(e => console.log('Email skipped:', e.message));
    }

    const io = req.app.get('io');
    if (io) io.emit('new_order');

    res.status(201).json({ success: true, data: order, message: 'Order placed successfully!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── USER: Get My Orders ──
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.book', 'title author coverImage')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── USER: Cancel Request ──
router.put('/:id/cancel-request', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['placed', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this order at this stage' });
    }
    order.orderStatus = 'cancel_requested';
    order.cancelReason = req.body.reason || 'Requested by user';
    order.cancelRequestedAt = new Date();
    await order.save();
    res.json({ success: true, data: order, message: 'Cancel request sent to admin!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── USER: Refund Request (for placed/confirmed/processing orders) ──
router.put('/:id/refund-request', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['placed', 'confirmed', 'processing', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Refund request not allowed at this stage' });
    }
    if (order.refundRequestedByUser) {
      return res.status(400).json({ success: false, message: 'Refund already requested for this order' });
    }
    order.refundRequestedByUser = true;
    order.refundRequestReason = req.body.reason || 'Requested by user';
    order.refundRequestedAt = new Date();
    if (order.refundStatus === 'none') order.refundStatus = 'pending';
    await order.save();
    res.json({ success: true, data: order, message: 'Refund request submitted! Admin will review shortly.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET SINGLE ORDER (For Invoice) — MUST be last /:id route (Fix #5) ──
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone membershipId')
      .populate('items.book', 'title author coverImage isbn price');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Auth check
    if (order.user._id.toString() !== req.user._id.toString() && !['admin', 'librarian'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this invoice' });
    }
    
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
