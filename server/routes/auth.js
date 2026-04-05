const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone, role: role || 'member' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    res.status(201).json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, membershipId: user.membershipId, phone: user.phone, luxePoints: user.luxePoints } });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    res.json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, membershipId: user.membershipId, phone: user.phone, luxePoints: user.luxePoints } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name: req.body.name, phone: req.body.phone }, { new: true });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.oldPassword))) return res.status(401).json({ success: false, message: 'Current password incorrect' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── FORGOT PASSWORD ──
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user, resetToken);
      res.json({ success: true, message: `Password reset link sent to ${email}` });
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ success: false, message: 'Email could not be sent. Check email configuration.' });
    }
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── RESET PASSWORD ──
router.put('/reset-password/:token', async (req, res) => {
  try {
    const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    res.json({ success: true, message: 'Password reset successful!', token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── SAVED ADDRESSES ──
router.get('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedAddresses');
    res.json({ success: true, data: user.savedAddresses || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/addresses', protect, async (req, res) => {
  try {
    const { label, fullName, phone, street, city, state, pincode, isDefault } = req.body;
    const user = await User.findById(req.user._id);
    if (isDefault) user.savedAddresses.forEach(a => a.isDefault = false);
    user.savedAddresses.push({ label, fullName, phone, street, city, state, pincode, isDefault: isDefault || false });
    await user.save();
    res.json({ success: true, data: user.savedAddresses, message: 'Address saved!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/addresses/:idx', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist || []; // ensure it's loaded properly just in case
    user.savedAddresses.splice(req.params.idx, 1);
    await user.save();
    res.json({ success: true, message: 'Address removed!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── WISHLIST ──
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ success: true, data: user.wishlist || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/wishlist/toggle', protect, async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ success: false, message: 'Book ID required' });
    
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist || [];
    
    let isAdded = false;
    
    const index = user.wishlist.findIndex(id => id.toString() === bookId.toString());
    if (index !== -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(bookId);
      isAdded = true;
    }
    
    await user.save();
    const populatedUser = await User.findById(req.user._id).populate('wishlist');
    res.json({ success: true, data: populatedUser.wishlist, isAdded, message: isAdded ? 'Added to wishlist!' : 'Removed from wishlist!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;