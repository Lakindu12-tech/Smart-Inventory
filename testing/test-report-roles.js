const fetch = require('node-fetch');

const users = [
  { role: 'Owner', email: 'admin@inventory.com', password: 'admin123' },
  { role: 'Storekeeper', email: 'store@inventory.com', password: 'store123' },
  { role: 'Cashier', email: 'cashier@inventory.com', password: 'cashier123' },
];

const BASE_URL = 'http://localhost:3001';

async function loginAndTest(user) {
  try {
    // Login to get token
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password })
    });
    if (!loginRes.ok) throw new Error(`Login failed for ${user.role}`);
    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) throw new Error(`No token for ${user.role}`);

    // Call reports API
    const reportRes = await fetch(`${BASE_URL}/api/reports/sales`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!reportRes.ok) throw new Error(`Report API failed for ${user.role}`);
    const reportData = await reportRes.json();
    console.log(`\n=== ${user.role} ===`);
    console.log('Summary:', reportData.summary);
    console.log('Transactions:', Array.isArray(reportData.transactions) ? reportData.transactions.length : 'N/A');
  } catch (err) {
    console.error(`Error for ${user.role}:`, err.message);
  }
}

(async () => {
  for (const user of users) {
    await loginAndTest(user);
  }
})();


