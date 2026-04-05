const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { protect, staffOnly } = require('../middleware/auth');

// GET category counts (public)
router.get('/category-counts', async (req, res) => {
  try {
    const counts = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, available: { $sum: '$availableCopies' } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: counts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all books with search & filter (public)
router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, minRating, sortBy } = req.query;
    let query = {};
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } }
    ];
    // Ignore category if 'All' or 'all'
    if (category && category.toLowerCase() !== 'all') query.category = category;
    
    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Rating
    if (minRating) query.rating = { $gte: Number(minRating) };

    // Sorting
    let sortOptions = { createdAt: -1 }; // newest
    if (sortBy === 'price_asc') sortOptions = { price: 1 };
    else if (sortBy === 'price_desc') sortOptions = { price: -1 };
    else if (sortBy === 'rating_desc') sortOptions = { rating: -1 };
    else if (sortBy === 'newest') sortOptions = { createdAt: -1 };

    const books = await Book.find(query).sort(sortOptions);
    res.json({ success: true, data: books, count: books.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET recommended books for user (Phase 6 AI engine)
router.get('/recommended', protect, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const user = req.user;

    // Grab categories from user wishlist
    let preferredCategories = new Set();
    
    if (user.wishlist && user.wishlist.length > 0) {
      const populatedUser = await user.populate('wishlist', 'category');
      populatedUser.wishlist.forEach(item => {
        if (item.category) preferredCategories.add(item.category);
      });
    }

    // Grab categories from past orders (if any)
    const pastOrders = await Order.find({ user: user._id }).populate('items.book', 'category');
    pastOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.book && item.book.category) preferredCategories.add(item.book.category);
      });
    });

    const categoriesArray = Array.from(preferredCategories);
    let recommended = [];

    // If we have preferred categories, find highest rated books in them
    if (categoriesArray.length > 0) {
      recommended = await Book.find({ category: { $in: categoriesArray } })
        .sort({ rating: -1, numReviews: -1 }) // collaborative filtering via top ratings in favored genres
        .limit(6);
    } 

    // If still empty (new user), just recommend top global books
    if (recommended.length === 0) {
      recommended = await Book.find().sort({ rating: -1, numReviews: -1 }).limit(6);
    }

    res.json({ success: true, data: recommended });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single book (public)
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: book });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create book (staff only)
router.post('/', protect, staffOnly, async (req, res) => {
  try {
    const book = new Book(req.body);
    book.availableCopies = book.totalCopies;
    await book.save();
    res.status(201).json({ success: true, data: book, message: 'Book added!' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'ISBN already exists' });
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update book (staff only)
router.put('/:id', protect, staffOnly, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: book, message: 'Book updated!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE book (staff only)
router.delete('/:id', protect, staffOnly, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (book.availableCopies < book.totalCopies) {
      return res.status(400).json({ success: false, message: 'Cannot delete: book has active issues' });
    }
    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Book deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST review a book (protected member/customer)
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    // Phase 4: Verified Purchase Check
    const Order = require('../models/Order');
    const hasPurchased = await Order.exists({
      user: req.user._id,
      'items.book': book._id,
      orderStatus: { $in: ['confirmed', 'processing', 'ready', 'completed'] }
    });

    if (!hasPurchased && !['admin', 'librarian'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You can only review books that you have purchased or borrowed.' });
    }

    const alreadyReviewed = book.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ success: false, message: 'You have already reviewed this book' });

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id
    };

    book.reviews.push(review);
    book.numReviews = book.reviews.length;
    book.rating = book.reviews.reduce((acc, item) => item.rating + acc, 0) / book.reviews.length;

    await book.save();
    res.status(201).json({ success: true, message: 'Review added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET related books (same category, public)
router.get('/:id/related', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    
    const related = await Book.find({
      category: book.category,
      _id: { $ne: book._id }
    }).limit(4);
    
    res.json({ success: true, data: related });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
