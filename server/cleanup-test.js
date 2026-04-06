require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  
  const testUsers = await User.find({ email: /loadtest_/ });
  const userIds = testUsers.map(u => u._id);
  
  if (userIds.length > 0) {
    const deletedOrders = await Order.deleteMany({ user: { $in: userIds } });
    console.log(`Deleted ${deletedOrders.deletedCount} test orders.`);
    
    const deletedUsers = await User.deleteMany({ _id: { $in: userIds } });
    console.log(`Deleted ${deletedUsers.deletedCount} test users.`);
  } else {
    console.log('No test data found.');
  }

  mongoose.connection.close();
}
run();
