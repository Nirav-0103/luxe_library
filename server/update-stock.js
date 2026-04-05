const mongoose = require('mongoose');
require('dotenv').config({ path: '/Users/niravahir/Desktop/LUXE_LIBRARY/server/.env' });
const Book = require('./models/Book');

async function updateStock() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_luxury_db');
    console.log('Connected to DB. Updating book stocks...');
    
    // Fetch all books
    const books = await Book.find({});
    
    let count = 0;
    for (const book of books) {
      const stock = Math.floor(Math.random() * (1200 - 600 + 1)) + 600; // Between 600 and 1200
      book.totalCopies = stock;
      // Since we just seeded them and no one has borrowed yet, available == total
      book.availableCopies = stock; 
      await book.save();
      count++;
    }
    
    console.log(`Successfully updated the stock limit to 600-1200 for ${count} books.`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during stock update:', err);
    process.exit(1);
  }
}

updateStock();
