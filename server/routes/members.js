const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { protect, staffOnly } = require('../middleware/auth');

router.get('/', protect, staffOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { membershipId: { $regex: search, $options: 'i' } }];
    const members = await Member.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: members, count: members.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, staffOnly, async (req, res) => {
  try {
    const member = new Member(req.body);
    await member.save();
    res.status(201).json({ success: true, data: member, message: 'Member registered!' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Email already exists' });
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, staffOnly, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: member, message: 'Member updated!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, staffOnly, async (req, res) => {
  try {
    const Issue = require('../models/Issue');
    const active = await Issue.countDocuments({ member: req.params.id, status: { $in: ['issued', 'overdue'] } });
    if (active > 0) return res.status(400).json({ success: false, message: 'Member has active issues' });
    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Member deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
