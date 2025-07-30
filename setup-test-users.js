const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API = 'http://localhost:3000/api';

async function setupTestUsers() {
  console.log('Setting up test users...');
  
  // First, let's try to create the owner if it doesn't exist
  // We'll need to create it directly in the database or through a setup script
  
  // For now, let's try to login with the provided credentials
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@inventory.com', password: 'admin123' })
  });
  
  if (loginRes.ok) {
    console.log('✅ Owner login successful');
    const ownerData = await loginRes.json();
    
    // Now create test users
    const testUsers = [
      { name: 'Test Storekeeper', email: 'storekeeper@test.com', role: 'storekeeper' },
      { name: 'Test Cashier', email: 'cashier@test.com', role: 'cashier' }
    ];
    
    for (const user of testUsers) {
      console.log(`Creating ${user.role}...`);
      const res = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerData.token}` },
        body: JSON.stringify(user)
      });
      
      if (res.ok) {
        console.log(`✅ ${user.role} created successfully`);
      } else {
        const error = await res.json();
        console.log(`❌ Failed to create ${user.role}:`, error.message);
      }
    }
  } else {
    console.log('❌ Owner login failed');
    console.log('Please ensure the owner user exists with email: admin@inventory.com and password: password-admin123');
  }
}

setupTestUsers().catch(console.error); 