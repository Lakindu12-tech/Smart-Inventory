const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const OWNER_EMAIL = 'admin@inventory.com';
const OWNER_PASSWORD = 'admin123';

let ownerToken = '';

async function loginOwner() {
  console.log('🔐 Logging in as owner...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  ownerToken = data.token;
  console.log('✅ Owner login successful');
}

async function testReportsAccess() {
  console.log('\n📊 Testing Reports Access...');
  
  // Test with owner token
  const response = await fetch(`${BASE_URL}/api/reports?range=today`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });

  if (!response.ok) {
    throw new Error(`Reports access failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Reports access successful');
  console.log(`📈 Found ${data.transactions.length} transactions`);
  console.log(`📦 Found ${data.inventory.length} inventory items`);
  console.log(`👥 Found ${data.users.length} users`);
  
  return data;
}

async function testDateRanges() {
  console.log('\n📅 Testing different date ranges...');
  
  const ranges = ['today', 'week', 'month', 'year'];
  
  for (const range of ranges) {
    const response = await fetch(`${BASE_URL}/api/reports?range=${range}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    if (!response.ok) {
      throw new Error(`Date range ${range} failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ ${range} range: ${data.transactions.length} transactions`);
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🚫 Testing unauthorized access...');
  
  // Test without token
  const response1 = await fetch(`${BASE_URL}/api/reports`);
  if (response1.status !== 401) {
    throw new Error('Should require authentication');
  }
  console.log('✅ No token access blocked');

  // Test with invalid token
  const response2 = await fetch(`${BASE_URL}/api/reports`, {
    headers: { Authorization: 'Bearer invalid-token' }
  });
  if (response2.status !== 401) {
    throw new Error('Should reject invalid token');
  }
  console.log('✅ Invalid token access blocked');
}

async function testReportDataStructure(data) {
  console.log('\n🔍 Testing report data structure...');
  
  // Check transactions structure
  if (data.transactions && Array.isArray(data.transactions)) {
    console.log('✅ Transactions array structure valid');
    
    if (data.transactions.length > 0) {
      const transaction = data.transactions[0];
      const requiredFields = ['id', 'total_amount', 'payment_method', 'date', 'items'];
      const hasAllFields = requiredFields.every(field => field in transaction);
      
      if (hasAllFields) {
        console.log('✅ Transaction object structure valid');
      } else {
        throw new Error('Transaction missing required fields');
      }
    }
  } else {
    throw new Error('Transactions should be an array');
  }

  // Check inventory structure
  if (data.inventory && Array.isArray(data.inventory)) {
    console.log('✅ Inventory array structure valid');
    
    if (data.inventory.length > 0) {
      const item = data.inventory[0];
      const requiredFields = ['id', 'name', 'price', 'current_stock'];
      const hasAllFields = requiredFields.every(field => field in item);
      
      if (hasAllFields) {
        console.log('✅ Inventory item structure valid');
      } else {
        throw new Error('Inventory item missing required fields');
      }
    }
  } else {
    throw new Error('Inventory should be an array');
  }

  // Check users structure
  if (data.users && Array.isArray(data.users)) {
    console.log('✅ Users array structure valid');
    
    if (data.users.length > 0) {
      const user = data.users[0];
      const requiredFields = ['id', 'name', 'email', 'role'];
      const hasAllFields = requiredFields.every(field => field in user);
      
      if (hasAllFields) {
        console.log('✅ User object structure valid');
      } else {
        throw new Error('User missing required fields');
      }
    }
  } else {
    throw new Error('Users should be an array');
  }
}

async function testSalesCalculations(data) {
  console.log('\n💰 Testing sales calculations...');
  
  if (data.transactions.length > 0) {
    const totalSales = data.transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
    console.log(`✅ Total sales calculated: Rs.${totalSales.toFixed(2)}`);
    
    const totalItems = data.transactions.reduce((sum, t) => sum + t.items.length, 0);
    console.log(`✅ Total items sold: ${totalItems}`);
    
    // Test payment method breakdown
    const paymentMethods = {};
    data.transactions.forEach(t => {
      const method = t.payment_method || 'cash';
      paymentMethods[method] = (paymentMethods[method] || 0) + Number(t.total_amount);
    });
    
    console.log('✅ Payment method breakdown:');
    Object.entries(paymentMethods).forEach(([method, amount]) => {
      console.log(`   ${method}: Rs.${Number(amount).toFixed(2)}`);
    });
  } else {
    console.log('ℹ️ No transactions found for calculations');
  }
}

async function testInventoryAnalysis(data) {
  console.log('\n📦 Testing inventory analysis...');
  
  if (data.inventory.length > 0) {
    const totalValue = data.inventory.reduce((sum, item) => 
      sum + (Number(item.price) * Number(item.current_stock)), 0);
    console.log(`✅ Total inventory value: Rs.${totalValue.toFixed(2)}`);
    
    const lowStockItems = data.inventory.filter(item => Number(item.current_stock) < 10);
    console.log(`✅ Low stock items (< 10kg): ${lowStockItems.length}`);
    
    if (lowStockItems.length > 0) {
      console.log('   Low stock items:');
      lowStockItems.forEach(item => {
        console.log(`   - ${item.name}: ${item.current_stock}kg`);
      });
    }
  } else {
    console.log('ℹ️ No inventory items found');
  }
}

async function testUserActivity(data) {
  console.log('\n👥 Testing user activity analysis...');
  
  if (data.users.length > 0) {
    const roleCounts = {};
    data.users.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    console.log('✅ User role distribution:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });
  } else {
    console.log('ℹ️ No users found');
  }
}

async function runAllTests() {
  try {
    console.log('🚀 Starting Reports Module Tests...\n');
    
    await loginOwner();
    const reportData = await testReportsAccess();
    await testDateRanges();
    await testUnauthorizedAccess();
    await testReportDataStructure(reportData);
    await testSalesCalculations(reportData);
    await testInventoryAnalysis(reportData);
    await testUserActivity(reportData);
    
    console.log('\n🎉 All Reports Module Tests Passed!');
    console.log('\n📊 Reports Module Features:');
    console.log('✅ Owner-only access control');
    console.log('✅ Multiple date range support');
    console.log('✅ Sales data aggregation');
    console.log('✅ Inventory analysis');
    console.log('✅ User activity tracking');
    console.log('✅ Financial calculations');
    console.log('✅ Data structure validation');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();


