require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB.');

    const books = await Book.find({});
    let updatedCount = 0;

    for (const book of books) {
      let changed = false;

      // 1. Fix 9-digit ISBNs
      let isbnStr = book.isbn || '';
      if (isbnStr.length === 9) {
        book.isbn = isbnStr + Math.floor(Math.random() * 10).toString(); // add 1 random digit
        changed = true;
      }

      // 2. Random availability between 899 and 2000
      const newAvail = Math.floor(Math.random() * (2000 - 899 + 1)) + 899;
      // Force update of copies
      book.totalCopies = newAvail;
      book.availableCopies = newAvail;
      changed = true; // unconditionally update copies based on the prompt

      if (changed) {
        await book.save();
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} books.`);
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    mongoose.connection.close();
  }
}

run();
