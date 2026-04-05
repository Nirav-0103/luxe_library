const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    await mongoose.connection.collection('orders').dropIndex('orderNo_1');
    console.log('Index orderNo_1 dropped successfully');
  } catch(e) { console.log('Index might not exist entirely or error:', e.message); }
  process.exit(0);
});
