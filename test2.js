const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'admin@inventory.com';
const PASSWORD = 'admin123';

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  const data = await res.json();
  return data.token;
}

async function addProduct(token, product) {
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });
  const data = await res.json();
  return { status: res.status, data };
}

(async () => {
  const token = await login();
  if (!token) {
    console.error('Login failed, cannot test add product');
    return;
  }
  const product = {
    name: 'Test Product ' + Date.now(),
    price: 100,
    category: 'Test Category',
    stock: 50
  };
  console.log('Adding product:', product);
  const result = await addProduct(token, product);
  console.log('Add product status:', result.status);
  console.log('Add product response:', result.data);
})();
