const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API = 'http://localhost:3000/api';

async function resetPassword() {
  console.log('Logging in as owner...');
  
  // Login as owner
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@inventory.com', password: 'admin123' })
  });
  
  if (!loginRes.ok) {
    console.log('❌ Owner login failed');
    return;
  }
  
  const ownerData = await loginRes.json();
  console.log('✅ Owner login successful');
  
  // Reset storekeeper password
  console.log('Resetting storekeeper password...');
  const resetRes = await fetch(`${API}/users/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerData.token}` },
    body: JSON.stringify({ 
      email: 'lakinduabeyrathne2002@gmail.com', 
      newPassword: 'lakindu' 
    })
  });
  
  if (resetRes.ok) {
    console.log('✅ Password reset successful');
  } else {
    const error = await resetRes.json();
    console.log('❌ Password reset failed:', error);
  }
}

resetPassword();


