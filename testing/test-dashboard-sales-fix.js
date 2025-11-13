const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testDashboardSalesFix() {
  console.log('\n🧪 Testing Dashboard Sales Fix\n');
  console.log('='.repeat(50));

  // First, login to get a token
  console.log('\n1️⃣ Logging in as cashier...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'cashier@inventory.com',
      password: 'cashier123'
    })
  });

  if (!loginRes.ok) {
    console.log('❌ Login failed');
    return;
  }

  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✅ Login successful');

  // Fetch sales with transactions
  console.log('\n2️⃣ Fetching sales with transactions...');
  const salesRes = await fetch(`${BASE_URL}/api/sales?transactions=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!salesRes.ok) {
    console.log('❌ Failed to fetch sales');
    return;
  }

  const salesData = await salesRes.json();
  console.log(`✅ Retrieved ${salesData.transactions?.length || 0} transactions`);

  if (salesData.transactions && salesData.transactions.length > 0) {
    const firstTransaction = salesData.transactions[0];
    console.log('\n📄 Sample Transaction:');
    console.log(`   ID: ${firstTransaction.id}`);
    console.log(`   Number: ${firstTransaction.transaction_number}`);
    console.log(`   Amount: Rs.${firstTransaction.total_amount}`);
    console.log(`   Date: ${firstTransaction.date || firstTransaction.created_at || 'MISSING!'}`);
    console.log(`   Cashier: ${firstTransaction.cashier_name}`);

    // Calculate today's stats
    const today = new Date().toDateString();
    const todayTransactions = salesData.transactions.filter(t => {
      const transactionDate = t.date || t.created_at;
      if (!transactionDate) {
        console.log(`\n⚠️  Transaction ${t.id} has no date field!`);
        return false;
      }
      return new Date(transactionDate).toDateString() === today;
    });

    const todaySales = todayTransactions.length;
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);

    console.log('\n📊 Today\'s Statistics:');
    console.log(`   Today's Sales: ${todaySales} transactions`);
    console.log(`   Today's Revenue: Rs.${todayRevenue.toFixed(2)}`);

    if (todaySales === 0) {
      console.log('\n⚠️  No transactions today. Try creating a transaction first!');
      console.log(`   Current date: ${today}`);
      console.log(`   Sample transaction date: ${new Date(salesData.transactions[0].date || salesData.transactions[0].created_at).toDateString()}`);
    } else {
      console.log('\n✅ Dashboard should now show correct Today\'s Sales and Revenue!');
    }
  } else {
    console.log('\n⚠️  No transactions found in database');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Test completed!\n');
}

testDashboardSalesFix().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
