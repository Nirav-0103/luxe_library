const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, adminOnly } = require('../middleware/auth');

// GET site settings (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) {
      settings = await Settings.create({ key: 'global' });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update site settings (admin only)
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const { libraryName, libraryPhone, libraryEmail, libraryAddress, chatbotEnabled, maintenanceMode } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { libraryName, libraryPhone, libraryEmail, libraryAddress, chatbotEnabled, maintenanceMode },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: settings, message: 'Settings saved!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
