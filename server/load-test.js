const axios = require('axios');
const crypto = require('crypto');

const API = process.env.API_URL || 'http://localhost:8080/api';
const NUM_USERS = 50;

async function runTest() {
  console.log(`Starting massive load test against ${API}...`);
  const startTime = Date.now();

  try {
    let rawGetStart = Date.now();
    await Promise.all(
      Array.from({ length: 150 }).map(() => axios.get(`${API}/books?limit=10`))
    );
    let rawGetTime = Date.now() - rawGetStart;
    console.log(`[Baseline] 150 concurrent GET /api/books completed in ${rawGetTime}ms`);

    console.log(`\n1. Creating ${NUM_USERS} users concurrently...`);
    const users = Array.from({ length: NUM_USERS }).map((_, i) => ({
      name: `Load Test User ${i}`,
      email: `loadtest_${crypto.randomBytes(4).toString('hex')}@luxe.com`,
      password: 'password123',
    }));

    const regStart = Date.now();
    const registered = await Promise.all(
      users.map(u => axios.post(`${API}/auth/register`, u))
    );
    console.log(`✓ 50 registrations completed in ${Date.now() - regStart}ms`);
    
    // Log them all in
    const tokens = registered.map(r => r.data.token);

    // Get a book to order
    const bookRes = await axios.get(`${API}/books?limit=1`);
    const book1 = bookRes.data.data[0];
    
    if (!book1) {
      console.log('No books found to order.');
      return;
    }

    console.log(`\n2. Creating Orders concurrently... (Simulating checkout bottleneck)`);
    const orderStart = Date.now();
    const orderPromises = tokens.map(token => 
      axios.post(`${API}/orders`, {
        items: [{ book: book1._id, quantity: 1 }],
        paymentMethod: 'cod',
        deliveryAddress: { street: 'Main', city: 'Mumbai', state: 'MH', zipCode: '400001', country: 'India' }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.error('Order err:', err.response?.data?.message || err.message);
        throw err;
      })
    );

    const orders = await Promise.all(orderPromises);
    console.log(`✓ ${NUM_USERS} concurrent orders completed in ${Date.now() - orderStart}ms`);

    console.log(`\n3. Admin logging in and accepting all orders concurrently...`);
    const adminRes = await axios.post(`${API}/auth/login`, {
      email: process.env.ADMIN_EMAIL || 'admin@luxelibrary.com',
      password: process.env.ADMIN_PASSWORD || 'vR9%qL#2pHm@8!xK' 
    });
    const adminToken = adminRes.data.token;

    const acceptStart = Date.now();
    const acceptPromises = orders.map(o => 
      axios.put(`${API}/orders/admin/${o.data.data._id}/status`, {
        status: 'confirmed'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
    );

    await Promise.all(acceptPromises);
    console.log(`✓ Admin accepted ${NUM_USERS} orders in ${Date.now() - acceptStart}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`\n================================`);
    console.log(`Load test completely passed!`);
    console.log(`Total Elapsed Time: ${totalTime}ms`);
    console.log(`================================`);

  } catch (e) {
    console.error('Load test failed!', e.response?.data?.message || e.message);
  }
}

runTest();
