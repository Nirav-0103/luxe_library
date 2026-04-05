const mongoose = require('mongoose');
require('dotenv').config({ path: '/Users/niravahir/Desktop/LUXE_LIBRARY/server/.env' });
const Order = require('./models/Order');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_luxury_db');
    const res = await Order.updateMany(
      { orderStatus: 'completed', paymentMethod: 'cod', paymentStatus: 'pending' },
      { $set: { paymentStatus: 'paid' } }
    );
    console.log(res);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
fix();
