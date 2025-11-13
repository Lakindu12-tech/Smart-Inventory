/**
 * Performance Test: Approve/Reject Request Speed
 * Tests the optimized approve and reject endpoints
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials (use your actual test credentials)
const OWNER_CREDENTIALS = {
  username: 'owner',
  password: 'owner123'
};

const STOREKEEPER_CREDENTIALS = {
  username: 'store1',
  password: 'store123'
};

let ownerToken = '';
let storekeeperToken = '';

// Helper function to login
async function login(credentials) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await response.json();
  return data.token;
}

// Helper function to create a test request
async function createTestRequest(token, requestData) {
  const response = await fetch(`${BASE_URL}/api/product-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestData)
  });
  return await response.json();
}

// Test approve endpoint speed
async function testApproveSpeed(requestId) {
  const startTime = Date.now();
  
  const response = await fetch(`${BASE_URL}/api/product-requests/${requestId}/approve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ owner_comment: 'Approved for testing' })
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const result = await response.json();
  
  return {
    success: response.ok,
    duration,
    result
  };
}

// Test reject endpoint speed
async function testRejectSpeed(requestId) {
  const startTime = Date.now();
  
  const response = await fetch(`${BASE_URL}/api/product-requests/${requestId}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ owner_comment: 'Rejected for testing' })
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const result = await response.json();
  
  return {
    success: response.ok,
    duration,
    result
  };
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Performance Tests for Approve/Reject\n');
  
  try {
    // Login
    console.log('📝 Logging in...');
    ownerToken = await login(OWNER_CREDENTIALS);
    storekeeperToken = await login(STOREKEEPER_CREDENTIALS);
    console.log('✅ Login successful\n');
    
    // Create test requests
    console.log('📝 Creating test requests...');
    
    const stockRequest = await createTestRequest(storekeeperToken, {
      type: 'stock',
      product_id: 1,
      requested_quantity: 10,
      reason: 'Test stock request for performance testing'
    });
    
    const priceRequest = await createTestRequest(storekeeperToken, {
      type: 'price',
      product_id: 2,
      requested_price: 150.00,
      reason: 'Test price request for performance testing'
    });
    
    console.log(`✅ Created test requests: ${stockRequest.id}, ${priceRequest.id}\n`);
    
    // Test approve speed
    console.log('⚡ Testing APPROVE endpoint...');
    const approveResult = await testApproveSpeed(stockRequest.id);
    console.log(`   Duration: ${approveResult.duration}ms`);
    console.log(`   Success: ${approveResult.success}`);
    console.log(`   Response: ${JSON.stringify(approveResult.result)}`);
    
    if (approveResult.duration < 500) {
      console.log('   ✅ EXCELLENT - Under 500ms!');
    } else if (approveResult.duration < 1000) {
      console.log('   ✅ GOOD - Under 1 second');
    } else {
      console.log('   ⚠️  SLOW - Over 1 second');
    }
    console.log('');
    
    // Test reject speed
    console.log('⚡ Testing REJECT endpoint...');
    const rejectResult = await testRejectSpeed(priceRequest.id);
    console.log(`   Duration: ${rejectResult.duration}ms`);
    console.log(`   Success: ${rejectResult.success}`);
    console.log(`   Response: ${JSON.stringify(rejectResult.result)}`);
    
    if (rejectResult.duration < 300) {
      console.log('   ✅ EXCELLENT - Under 300ms!');
    } else if (rejectResult.duration < 500) {
      console.log('   ✅ GOOD - Under 500ms');
    } else {
      console.log('   ⚠️  SLOW - Over 500ms');
    }
    console.log('');
    
    // Summary
    console.log('📊 PERFORMANCE SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Approve endpoint: ${approveResult.duration}ms`);
    console.log(`Reject endpoint:  ${rejectResult.duration}ms`);
    console.log(`Average:          ${Math.round((approveResult.duration + rejectResult.duration) / 2)}ms`);
    console.log('');
    
    if (approveResult.duration < 500 && rejectResult.duration < 300) {
      console.log('🎉 PERFORMANCE: EXCELLENT! Ready for production!');
    } else {
      console.log('⚠️  Performance could be improved');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the tests
runTests();
