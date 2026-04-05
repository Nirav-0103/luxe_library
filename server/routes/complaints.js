const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

// ── USER: Create Complaint ──
router.post('/', protect, async (req, res) => {
  try {
    const { orderId, subject, description, priority } = req.body;
    if (!orderId || !subject || !description) {
      return res.status(400).json({ success: false, message: 'Order, subject, and description are required' });
    }

    // Verify the order belongs to this user
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if complaint already exists for this order
    const existing = await Complaint.findOne({ user: req.user._id, order: orderId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a complaint for this order. Check its status.' });
    }

    const complaint = await Complaint.create({
      user: req.user._id,
      order: orderId,
      orderNumber: order.orderNumber,
      subject,
      description,
      priority: priority || 'medium',
    });

    res.status(201).json({ success: true, data: complaint, message: 'Complaint submitted! Our team will review it shortly.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── USER: Get My Complaints ──
router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .populate('order', 'orderNumber totalAmount orderStatus paymentStatus')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Get All Complaints ──
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;

    const complaints = await Complaint.find(query)
      .populate('user', 'name email membershipId')
      .populate('order', 'orderNumber totalAmount orderStatus paymentStatus')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: complaints, count: complaints.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Get Complaint Stats ──
router.get('/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'open' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'closed' }),
    ]);
    res.json({ success: true, data: { total, open, inProgress, resolved, closed } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Update Complaint (respond / change status) ──
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminResponse, priority } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    if (status) complaint.status = status;
    if (adminResponse) {
      complaint.adminResponse = adminResponse;
      complaint.respondedAt = new Date();
    }
    if (priority) complaint.priority = priority;
    if (status === 'resolved' || status === 'closed') complaint.resolvedAt = new Date();

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('user', 'name email membershipId')
      .populate('order', 'orderNumber totalAmount orderStatus');

    res.json({ success: true, data: populated, message: `Complaint ${status || 'updated'}!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
