// Billing module test: cashier login, create bill, check stock reduction
// Run with: node testing/test-billing-module.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API = 'http://localhost:3000/api';
const cashier = { email: 'cashier@inventory.com', password: 'cashier123' };

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cashier)
  });
  if (!res.ok) throw new Error('Cashier login failed');
  const data = await res.json();
  return data.token;
}

async function getProducts(token) {
  const res = await fetch(`${API}/products`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return await res.json();
}

async function createBill(token, product) {
  const bill = {
    items: [{ product_id: product.id, quantity: 1 }],
    customer_name: 'Test Customer',
    payment_method: 'cash'
  };
  const res = await fetch(`${API}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(bill)
  });
  if (!res.ok) throw new Error('Bill creation failed');
  return await res.json();
}

async function main() {
  try {
    const token = await login();
    console.log('✅ Cashier login successful');

    let products = await getProducts(token);
    const product = products.find(p => p.current_stock > 0);
    if (!product) throw new Error('No product with stock available');
    console.log(`Selected product: ${product.name} (Current Stock: ${product.current_stock})`);

    const stockBefore = product.current_stock;
    await createBill(token, product);
    console.log('✅ Bill created successfully');

    products = await getProducts(token);
    const updatedProduct = products.find(p => p.id === product.id);
    const stockAfter = updatedProduct ? updatedProduct.current_stock : null;
    console.log(`Stock before: ${stockBefore}, Stock after: ${stockAfter}`);
    if (Number(stockAfter) === Number(stockBefore) - 1) {
      console.log('✅ Stock reduced correctly after billing');
      console.log('🎉 Billing module test passed!');
    } else {
      console.log('❌ Stock did not reduce as expected');
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

main();
