const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Check if already subscribed
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already subscribed' });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    // Send Welcome Email
    try {
      await transporter.sendMail({
        from: `"Luxe Library" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to Luxe Library!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #C9A84C;">Welcome to Luxe Library!</h2>
            <p>Thank you for subscribing to our newsletter.</p>
            <p>You'll be the first to know about new arrivals, curated collections, and exclusive author events.</p>
            <br/>
            <p>Happy Reading,<br/><strong>The Luxe Library Team</strong></p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('Failed to send welcome email:', mailErr);
      // We still return success since they are officially subscribed in DB
    }

    res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'This email is already subscribed' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
