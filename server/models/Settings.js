const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  libraryName:     { type: String, default: 'Luxe Library' },
  libraryPhone:    { type: String, default: '+91 96246 07410' },
  libraryEmail:    { type: String, default: 'niravahir448@gmail.com' },
  libraryAddress:  { type: String, default: 'Kapodara, Surat, Gujarat' },
  chatbotEnabled:  { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
