const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.set('trust proxy', 1); // Fixes express-rate-limit crash behind local proxies

// Performance Setup
const compression = require('compression');
app.use(compression());

// Phase 11: Security Hardening
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet({ crossOriginResourcePolicy: false })); // allow cross-origin requests locally

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20000, 
  message: { success: false, message: 'Too many requests, slow down please.' }
});
app.use('/api', limiter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true }
});

// Attach io to req so routers can do nested emits
app.set('io', io);

// Viewers Tracking
const viewers = {};
io.on('connection', (socket) => {
  socket.on('join_book', (bookId) => {
    socket.join(`book_${bookId}`);
    if (!viewers[bookId]) viewers[bookId] = 0;
    viewers[bookId]++;
    io.to(`book_${bookId}`).emit('viewers_count', viewers[bookId]);
  });

  socket.on('leave_book', (bookId) => {
    socket.leave(`book_${bookId}`);
    if (viewers[bookId] > 0) viewers[bookId]--;
    io.to(`book_${bookId}`).emit('viewers_count', viewers[bookId]);
  });

  socket.on('disconnect', () => {
    // Basic cleanup logic omitted for simplicity since we don't map socket.id to bookId directly
  });
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/members', require('./routes/members'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/complaints', require('./routes/complaints'));

app.get('/', (req, res) => res.json({ message: 'Library API Running' }));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    // Ensure default admin exists (Fix #10: uses env vars — no hardcoded credentials)
    const User = require('./models/User');
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass  = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPass) {
      console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin bootstrap.');
    } else {
      const existing = await User.findOne({ email: adminEmail });
      if (!existing) {
        await User.create({ name: 'Nirav Admin', email: adminEmail, password: adminPass, role: 'admin' });
        console.log('✅ Default admin created:', adminEmail);
      } else {
        if (existing.role !== 'admin') {
          await User.findByIdAndUpdate(existing._id, { role: 'admin' });
          console.log('✅ Admin role fixed for:', adminEmail);
        } else {
          console.log('✅ Admin already exists:', adminEmail);
        }
      }
    }

    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => console.log('Server on port ' + PORT));
  })
  .catch(err => {
    console.error('MongoDB Error:', err.message);
    process.exit(1);
  });