// Test script for bill reversal system
const token = 'YOUR_TOKEN_HERE'; // Replace with actual owner token

async function testReversalSystem() {
  console.log('🧪 Testing Bill Reversal System\n');

  try {
    // Test 1: Fetch reversal requests (should work even if empty)
    console.log('1. Testing GET /api/reversal-requests...');
    const response = await fetch('http://localhost:3000/api/reversal-requests', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API endpoint working');
      console.log('   Reversal requests found:', Array.isArray(data) ? data.length : 0);
      if (Array.isArray(data) && data.length > 0) {
        console.log('   First request:', data[0]);
      }
    } else {
      console.log('❌ API returned error:', response.status);
      const error = await response.text();
      console.log('   Error details:', error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// For browser console testing:
console.log(`
To test in browser console:
1. Login as owner
2. Open browser console
3. Copy/paste this code:

fetch('/api/reversal-requests', {
  headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(data => console.log('Reversal requests:', data))
.catch(err => console.error('Error:', err));
`);

// Uncomment to run (requires node-fetch):
// testReversalSystem();
