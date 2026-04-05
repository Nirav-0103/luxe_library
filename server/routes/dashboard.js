const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Member = require('../models/Member');
const Issue = require('../models/Issue');
const User = require('../models/User');
const { protect, staffOnly } = require('../middleware/auth');

router.get('/stats', protect, staffOnly, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const [totalBooks, totalMembers, totalUsers, activeIssues, overdueIssues, totalReturned, totalAvailable, recentIssues, categoryStats, placedOrders, confirmedOrders, completedOrders, cancelledOrders] = await Promise.all([
      Book.countDocuments(),
      Member.countDocuments(),
      User.countDocuments(),
      Issue.countDocuments({ status: { $in: ['issued', 'overdue'] } }),
      Issue.countDocuments({ status: 'overdue' }),
      Issue.countDocuments({ status: 'returned' }),
      Book.aggregate([{ $group: { _id: null, total: { $sum: '$availableCopies' } } }]),
      Issue.find({ status: { $in: ['issued', 'overdue'] } }).populate('book', 'title author').populate('member', 'name membershipId').sort({ createdAt: -1 }).limit(5),
      Book.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Order.countDocuments({ orderStatus: 'placed' }),
      Order.countDocuments({ orderStatus: 'confirmed' }),
      Order.countDocuments({ orderStatus: 'completed' }),
      Order.countDocuments({ orderStatus: 'cancelled' }),
    ]);
    res.json({
      success: true,
      data: { totalBooks, totalMembers, totalUsers, activeIssues, overdueIssues, totalReturned, availableCopies: totalAvailable[0]?.total || 0, recentIssues, categoryStats, placedOrders, confirmedOrders, completedOrders, cancelledOrders }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/advanced', protect, staffOnly, async (req, res) => {
  try {
    const Order = require('../models/Order');
    
    // 1. Sales/Revenue by Date
    const salesGraph = await Order.aggregate([
      { $match: { 
          paymentStatus: 'paid',
          orderStatus: { $in: ['confirmed', 'processing', 'ready', 'completed'] }
      } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        } 
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    // 2. Most Popular Books
    const popularBooks = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.book", sold: { $sum: "$items.quantity" } } },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'bookData' } },
      { $unwind: "$bookData" },
      { $project: { name: "$bookData.title", sold: 1, _id: 0 } }
    ]);

    // 3. User Growth
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: { salesGraph, popularBooks, userGrowth }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin-badges', protect, staffOnly, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Complaint = require('../models/Complaint');
    
    const [orders, refunds, issues, complaints] = await Promise.all([
      Order.countDocuments({ orderStatus: 'placed' }),
      Order.countDocuments({ refundRequestedByUser: true, refundStatus: { $ne: 'processed' } }),
      Issue.countDocuments({ status: { $in: ['issued', 'overdue'] } }),
      Complaint.countDocuments({ status: 'open' })
    ]);

    res.json({
      success: true,
      data: { orders, refunds, issues, complaints }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
