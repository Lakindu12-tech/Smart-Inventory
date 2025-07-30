const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const users = [
  { role: 'Owner', email: 'admin@inventory.com', password: 'admin123' },
  { role: 'Storekeeper', email: 'storekeeper@inventory.com', password: 'store123' },
  { role: 'Cashier', email: 'cashier@inventory.com', password: 'cashier123' },
];

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return res.ok ? data.token : null;
}

async function testUserManagement(token, role) {
  console.log(`\n[${role}] User Management:`);
  // Only owner can access
  let res = await fetch(`${BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
  console.log('  GET /api/users:', res.status);
  if (role === 'Owner') {
    // Try to create a new cashier
    res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Test Cashier', email: 'testcashier@inventory.com', role: 'cashier' })
    });
    const data = await res.json();
    console.log('  POST /api/users:', res.status, data.message || data);
    // Try to delete the new user
    if (data.userId) {
      res = await fetch(`${BASE_URL}/api/users?id=${data.userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const delData = await res.json();
      console.log('  DELETE /api/users:', res.status, delData.message || delData);
    }
  }
}

async function testProducts(token, role) {
  console.log(`\n[${role}] Product Management:`);
  let res = await fetch(`${BASE_URL}/api/products`, { headers: { Authorization: `Bearer ${token}` } });
  console.log('  GET /api/products:', res.status);
}

async function testStockRequests(token, role) {
  console.log(`\n[${role}] Stock Request:`);
  if (role === 'Storekeeper') {
    // Try to submit a stock request (invalid product for test)
    let res = await fetch(`${BASE_URL}/api/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_id: 9999, movement_type: 'in', quantity: 1, reason: 'Test' })
    });
    const data = await res.json();
    console.log('  POST /api/stock:', res.status, data.message || data);
  }
}

async function testSales(token, role) {
  console.log(`\n[${role}] Sales/Transaction:`);
  if (role === 'Cashier') {
    // Try to create a sale (invalid product for test)
    let res = await fetch(`${BASE_URL}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ transaction_number: 'TEST123', items: [{ product_id: 9999, quantity: 1 }], total_amount: 100 })
    });
    const data = await res.json();
    console.log('  POST /api/sales:', res.status, data.message || data);
  }
}

async function testTransactionHistory(token, role) {
  console.log(`\n[${role}] Transaction History:`);
  let res = await fetch(`${BASE_URL}/api/sales?transactions=true`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  console.log('  GET /api/sales?transactions=true:', res.status, Array.isArray(data.transactions) ? `Transactions: ${data.transactions.length}` : data.message || data);
}

async function testReports(token, role) {
  console.log(`\n[${role}] Report Generation:`);
  let res = await fetch(`${BASE_URL}/api/reports/sales`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  console.log('  GET /api/reports/sales:', res.status, data.summary ? 'Summary OK' : data.error || data);
}

async function runTests() {
  for (const user of users) {
    const token = await login(user.email, user.password);
    if (!token) {
      console.log(`\n[${user.role}] Login failed!`);
      continue;
    }
    console.log(`\n[${user.role}] Login successful.`);
    await testUserManagement(token, user.role);
    await testProducts(token, user.role);
    await testStockRequests(token, user.role);
    await testSales(token, user.role);
    await testTransactionHistory(token, user.role);
    await testReports(token, user.role);
  }
}

runTests(); 