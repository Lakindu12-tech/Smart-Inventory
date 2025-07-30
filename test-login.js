const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API = 'http://localhost:3000/api';

async function testLogin() {
  console.log('Testing storekeeper login...');
  
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: 'lakinduabeyrathne2002@gmail.com', 
      password: 'lakindu' 
    })
  });
  
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
  
  if (res.ok) {
    console.log('✅ Login successful');
  } else {
    console.log('❌ Login failed');
  }
}

async function testOwnerLogin() {
  console.log('Testing owner (admin) login...');
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: 'admin@inventory.com', 
      password: 'admin123' 
    })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
  if (res.ok) {
    console.log('✅ Owner login successful');
  } else {
    console.log('❌ Owner login failed');
  }
}

testLogin();
testOwnerLogin(); 