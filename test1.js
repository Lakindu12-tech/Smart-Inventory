const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const VALID_EMAIL = 'admin@inventory.com';
const VALID_PASSWORD = 'admin123';
const INVALID_EMAIL = 'wrong@inventory.com';
const INVALID_PASSWORD = 'wrongpass';

async function testLogin(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return { status: res.status, data };
}

(async () => {
  console.log('Testing valid credentials...');
  const valid = await testLogin(VALID_EMAIL, VALID_PASSWORD);
  console.log('Valid login status:', valid.status);
  console.log('Valid login response:', valid.data);

  console.log('\nTesting invalid credentials...');
  const invalid = await testLogin(INVALID_EMAIL, INVALID_PASSWORD);
  console.log('Invalid login status:', invalid.status);
  console.log('Invalid login response:', invalid.data);
})();
