const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/library_luxury_db')
  .then(async () => {
    const Book = require('./server/models/Book');
    const books = await Book.find().limit(5);
    console.log(books.map(b => ({ title: b.title, availableCopies: b.availableCopies })));
    process.exit(0);
  });
