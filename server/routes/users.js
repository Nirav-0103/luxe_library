const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET all users (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { search, role } = req.query;
    let query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role && role !== 'all') query.role = role;
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create user (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });
    const user = await User.create({ name, email, password: password || 'password123', role: role || 'member', phone });
    res.status(201).json({ success: true, data: user, message: 'User created!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update user (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, role, phone, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, email, role, phone, isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: 'User updated!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE user (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT toggle user status
router.put('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT reset user password (admin) — FIX 5: was missing, added
router.put('/:id/reset-password', protect, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: `Password reset for ${user.name}!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
