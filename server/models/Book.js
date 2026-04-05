const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true }
}, { timestamps: true });

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  isbn: { type: String, required: true, unique: true, trim: true },
  category: {
    type: String, required: true,
    enum: ['Science', 'Technology', 'History', 'Literature', 'Philosophy', 'Biography'],
    default: 'Science'
  },
  price: { type: Number, default: 0, min: 0 }, // ← NEW: borrow fee / purchase price
  totalCopies: { type: Number, required: true, min: 1, default: 1 },
  availableCopies: { type: Number, default: 1 },
  publisher: { type: String, trim: true },
  publishedYear: { type: Number },
  description: { type: String, trim: true },
  coverImage: { type: String, default: '' },
  extraImages: [{ type: String }],
  language: { type: String, default: 'English' },
  pages: { type: Number },
  reviews: [reviewSchema],
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 }
}, { timestamps: true });

// PHASE 9: Performance Optimization Indexing
bookSchema.index({ category: 1, rating: -1, price: 1 });
bookSchema.index({ title: 'text', author: 'text' });

module.exports = mongoose.model('Book', bookSchema);
