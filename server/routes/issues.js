const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Book = require('../models/Book');
const { protect, staffOnly } = require('../middleware/auth');

router.get('/', protect, staffOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    await Issue.updateMany({ status: 'issued', dueDate: { $lt: new Date() } }, { status: 'overdue' });
    const issues = await Issue.find(query).populate('book', 'title author isbn').populate('member', 'name email membershipId').sort({ createdAt: -1 });
    res.json({ success: true, data: issues, count: issues.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, staffOnly, async (req, res) => {
  try {
    const { bookId, memberId, dueDate } = req.body;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (book.availableCopies <= 0) return res.status(400).json({ success: false, message: 'No copies available' });
    const existing = await Issue.findOne({ book: bookId, member: memberId, status: { $in: ['issued', 'overdue'] } });
    if (existing) return res.status(400).json({ success: false, message: 'Member already has this book' });
    const issue = await Issue.create({ book: bookId, member: memberId, issuedBy: req.user._id, dueDate: dueDate || new Date(Date.now() + 14 * 864e5) });
    book.availableCopies -= 1;
    await book.save();
    const populated = await Issue.findById(issue._id).populate('book', 'title author isbn').populate('member', 'name email membershipId');
    res.status(201).json({ success: true, data: populated, message: 'Book issued!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id/return', protect, staffOnly, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
    if (issue.status === 'returned') return res.status(400).json({ success: false, message: 'Already returned' });
    const returnDate = new Date();
    issue.returnDate = returnDate;
    issue.status = 'returned';
    if (returnDate > issue.dueDate) {
      const days = Math.ceil((returnDate - issue.dueDate) / 864e5);
      issue.fine = days * 5;
    }
    await issue.save();
    await Book.findByIdAndUpdate(issue.book, { $inc: { availableCopies: 1 } });
    const populated = await Issue.findById(issue._id).populate('book', 'title author isbn').populate('member', 'name email membershipId');
    res.json({ success: true, data: populated, message: 'Book returned!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, staffOnly, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Not found' });
    if (issue.status !== 'returned') return res.status(400).json({ success: false, message: 'Cannot delete active issue' });
    await Issue.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
