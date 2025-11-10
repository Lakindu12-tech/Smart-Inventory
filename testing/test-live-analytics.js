require('dotenv').config();
const fetch = require('node-fetch');

async function testAnalyticsAPI() {
  console.log('🔍 Testing Analytics API response...\n');
  
  // First, get a valid token (simulate login)
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@inventory.com', password: 'admin123' })
  });
  
  if (!loginRes.ok) {
    console.error('❌ Login failed:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✅ Logged in as owner\n');
  
  // Now test the analytics API
  const analyticsRes = await fetch('http://localhost:3000/api/analytics?period=30d', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!analyticsRes.ok) {
    console.error('❌ Analytics API failed:', await analyticsRes.text());
    return;
  }
  
  const data = await analyticsRes.json();
  
  console.log('📊 Analytics API Response:');
  console.log('Period:', data.period);
  console.log('Start Date:', data.startDate);
  console.log('End Date:', data.endDate);
  console.log('\n💰 Sales Metrics:');
  console.log(JSON.stringify(data.salesMetrics, null, 2));
  console.log('\n📅 Daily Sales (last 5):');
  console.log(JSON.stringify(data.dailySales.slice(-5), null, 2));
  console.log('\n🏆 Top Products:');
  console.log(JSON.stringify(data.topProducts, null, 2));
  console.log('\n📦 Category Performance:');
  console.log(JSON.stringify(data.categoryPerformance, null, 2));
  console.log('\n👤 Cashier Performance:');
  console.log(JSON.stringify(data.cashierPerformance, null, 2));
  console.log('\n✅ Total transactions returned:', data.dailySales.length);
}

testAnalyticsAPI().catch(console.error);
