const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API = 'http://localhost:3000/api';

async function main() {
  // Helper to log and fail
  const fail = (msg) => { console.error('❌', msg); process.exit(1); };
  const log = (msg) => console.log('✅', msg);

  // 1. Login as owner
  log('Logging in as owner...');
  let res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@inventory.com', password: 'admin123' })
  });
  let data = await res.json();
  if (!res.ok) fail('Owner login failed: ' + (data.message || JSON.stringify(data)));
  const ownerToken = data.token;
  log('Owner login successful.');

  // 2. Login as storekeeper and cashier (passwords already changed to 5678)
  log('Logging in as storekeeper...');
  res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'store@test.com', password: '5678' })
  });
  data = await res.json();
  if (!res.ok) fail('Storekeeper login failed: ' + (data.message || JSON.stringify(data)));
  const storeToken2 = data.token;
  log('Storekeeper login successful.');

  log('Logging in as cashier...');
  res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cashier@test.com', password: '5678' })
  });
  data = await res.json();
  if (!res.ok) fail('Cashier login failed: ' + (data.message || JSON.stringify(data)));
  const cashierToken2 = data.token;
  log('Cashier login successful.');

  // 3. Storekeeper adds two products (papaya, mango)
  log('Storekeeper requests to add papaya...');
  res = await fetch(`${API}/product-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storeToken2}` },
    body: JSON.stringify({ type: 'add', product_name: 'Papaya', requested_quantity: 20, requested_price: 200 })
  });
  data = await res.json();
  if (!res.ok) fail('Papaya add request failed: ' + (data.message || JSON.stringify(data)));
  const papayaRequestId = data.requestId;
  log('Papaya add request submitted.');

  log('Storekeeper requests to add mango...');
  res = await fetch(`${API}/product-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storeToken2}` },
    body: JSON.stringify({ type: 'add', product_name: 'Mango', requested_quantity: 30, requested_price: 500 })
  });
  data = await res.json();
  if (!res.ok) fail('Mango add request failed: ' + (data.message || JSON.stringify(data)));
  const mangoRequestId = data.requestId;
  log('Mango add request submitted.');

  // 4. Owner approves papaya, rejects mango
  log('Owner approving papaya...');
  res = await fetch(`${API}/product-requests/${papayaRequestId}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ owner_comment: 'Approved' })
  });
  data = await res.json();
  if (!res.ok) fail('Papaya approval failed: ' + (data.message || JSON.stringify(data)));
  log('Papaya approved.');

  log('Owner rejecting mango...');
  res = await fetch(`${API}/product-requests/${mangoRequestId}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ owner_comment: 'Rejected' })
  });
  data = await res.json();
  if (!res.ok) fail('Mango rejection failed: ' + (data.message || JSON.stringify(data)));
  log('Mango rejected.');

  // 5. Storekeeper price change for papaya
  log('Storekeeper requests price change for papaya...');
  // Find papaya product id
  res = await fetch(`${API}/products`, {
    headers: { Authorization: `Bearer ${storeToken2}` }
  });
  let products = await res.json();
  const papaya = Array.isArray(products) ? products.find(p => p.name.toLowerCase() === 'papaya') : null;
  if (!papaya) fail('Papaya product not found after approval.');
  res = await fetch(`${API}/product-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storeToken2}` },
    body: JSON.stringify({ type: 'price', product_id: papaya.id, requested_price: 250 })
  });
  data = await res.json();
  if (!res.ok) fail('Papaya price change request failed: ' + (data.message || JSON.stringify(data)));
  const priceRequestId = data.requestId;
  log('Papaya price change request submitted.');

  // 6. Storekeeper stock in for papaya
  log('Storekeeper requests stock in for papaya...');
  res = await fetch(`${API}/product-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storeToken2}` },
    body: JSON.stringify({ type: 'stock', product_id: papaya.id, requested_quantity: 60 })
  });
  data = await res.json();
  if (!res.ok) fail('Papaya stock in request failed: ' + (data.message || JSON.stringify(data)));
  const stockRequestId = data.requestId;
  log('Papaya stock in request submitted.');

  // 7. Owner approves price and stock requests
  log('Owner approving papaya price change...');
  res = await fetch(`${API}/product-requests/${priceRequestId}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ owner_comment: 'Price change approved' })
  });
  data = await res.json();
  if (!res.ok) fail('Papaya price change approval failed: ' + (data.message || JSON.stringify(data)));
  log('Papaya price change approved.');

  log('Owner approving papaya stock in...');
  res = await fetch(`${API}/product-requests/${stockRequestId}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ owner_comment: 'Stock in approved' })
  });
  data = await res.json();
  if (!res.ok) fail('Papaya stock in approval failed: ' + (data.message || JSON.stringify(data)));
  log('Papaya stock in approved.');

  log('All tests completed successfully!');
}

main().catch(e => { console.error('❌ Unexpected error:', e); process.exit(1); });


