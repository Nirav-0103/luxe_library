const mongoose = require('mongoose');
require('dotenv').config({ path: '/Users/niravahir/Desktop/LUXE_LIBRARY/server/.env' });
const Book = require('./models/Book');

const CATEGORIES = ['Science', 'Technology', 'History', 'Literature', 'Philosophy', 'Biography'];

// Realistic word components
const titleParts = {
  Science: {
    prefixes: ["The Science of", "Introduction to", "Advanced", "Principles of", "Fundamentals of", "Modern", "Exploring"],
    stems: ["Quantum Mechanics", "Genetics", "Astrophysics", "Organic Chemistry", "Thermodynamics", "Neuroscience", "Evolutionary Biology", "Particle Physics"],
    suffixes: ["for Beginners", "in the Modern Era", ": A Comprehensive Guide", "", ""]
  },
  Technology: {
    prefixes: ["Mastering", "The Future of", "Building", "Algorithms in", "Applied", "The Art of"],
    stems: ["Artificial Intelligence", "Blockchain", "Cloud Computing", "Cybersecurity", "Machine Learning", "Data Structures", "Software Engineering"],
    suffixes: ["Using Python", ": A Practical Approach", "for Developers", ""]
  },
  History: {
    prefixes: ["A History of", "The Fall of", "The Rise of", "Chronicles of", "The Story of", "Echoes of"],
    stems: ["Ancient Rome", "the Ottoman Empire", "World War II", "the Renaissance", "the Industrial Revolution", "the Silk Road", "the Cold War"],
    suffixes: ["", ": A Reassessment", ": Based on New Evidence"]
  },
  Literature: {
    prefixes: ["The", "Poems of", "Tales of", "A Journey through", "Voices of", "Songs of"],
    stems: ["Forgotten Realm", "Silent Sea", "Lost Shadows", "Winter Winds", "Emerald City", "Silver Moon", "Long Night"],
    suffixes: ["", ""]
  },
  Philosophy: {
    prefixes: ["Meditations on", "The Philosophy of", "Critique of", "Reflections on", "Essays on"],
    stems: ["Ethics", "Existentialism", "Metaphysics", "Stoicism", "Human Nature", "Logic", "Political Thought"],
    suffixes: ["", ""]
  },
  Biography: {
    prefixes: ["The Life of", "Memoirs of", "Journals of", "The Legacy of", "In the Footsteps of"],
    stems: ["a Visionary", "an Artist", "a Leader", "a Rebel", "a Peacemaker", "an Innovator"],
    suffixes: [""]
  }
};

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez"];
const blurbs = [
  "An extensively researched and beautifully written book.",
  "Considered a masterpiece by critics around the globe.",
  "A profound and captivating journey.",
  "An essential read for anyone interested in this field.",
  "Brilliantly crafted with groundbreaking insights.",
  "A transformative piece of work that challenges the status quo."
];

function r(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateTitle(cat) {
  if (cat === 'Biography') {
    return `${r(titleParts.Biography.prefixes)} ${r(firstNames)} ${r(lastNames)}`.trim();
  }
  const pre = r(titleParts[cat].prefixes);
  const stem = r(titleParts[cat].stems);
  const suf = r(titleParts[cat].suffixes);
  let raw = `${pre} ${stem} ${suf}`;
  return raw.replace(/\s+/g, ' ').replace(/\s+:/, ':').trim();
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_luxury_db');
    console.log('Connected to DB. Wiping existing books...');
    
    // Wipe books
    await Book.deleteMany({});
    console.log('All books deleted.');
    
    const books = [];
    let isbnCounter = 978000000;

    for (const cat of CATEGORIES) {
      // 42 to 47 books per category
      const count = Math.floor(Math.random() * (47 - 42 + 1)) + 42; 
      console.log(`Generating ${count} books for ${cat}...`);

      for (let i = 0; i < count; i++) {
        const fakeTitle = generateTitle(cat);
        const copies = Math.floor(Math.random() * 5) + 2; // 2 to 6
        books.push({
          title: fakeTitle,
          author: `${r(firstNames)} ${r(lastNames)}`,
          isbn: String(isbnCounter++),
          category: cat,
          price: Math.floor(Math.random() * 400) + 100, // 100 to 500
          totalCopies: copies,
          availableCopies: copies,
          publisher: `${r(lastNames)} Publishing House`,
          publishedYear: Math.floor(Math.random() * 40) + 1980,
          description: `${r(blurbs)} This book explores the complex aspects of ${cat.toLowerCase()}, offering a fresh perspective that is suitable for enthusiasts and experts alike.`,
          
          // Picsum seed image to ensure it's diverse but constant for the same seed
          // Adding a tint or relying on Picsum is great because we don't know the exact UI colors from here, 
          // but Picsum landscape/abstract works great as fake book covers.
          coverImage: `https://picsum.photos/seed/${cat}_${i}_book/400/600`, 
          
          language: 'English',
          pages: Math.floor(Math.random() * 400) + 150,
          rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
          numReviews: Math.floor(Math.random() * 50)
        });
      }
    }

    console.log(`Inserting ${books.length} books into the database...`);
    await Book.insertMany(books);
    console.log(`Success! All ${books.length} beautifully curated books aded.`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
  }
}

seed();
