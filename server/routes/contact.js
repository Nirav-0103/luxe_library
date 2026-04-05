const express = require('express');
const router = express.Router();
const { sendContactNotification } = require('../utils/emailService');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    await sendContactNotification(name, email, phone, message);
    res.json({ success: true, message: 'Message sent! We will reply within 24 hours.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
});

module.exports = router;
