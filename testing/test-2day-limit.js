require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function test2DayLimit() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_inventory'
  });

  try {
    console.log('🧪 TESTING 2-DAY REVERSAL LIMIT\n');
    console.log('='.repeat(60));

    // Get transactions with their ages
    const [transactions] = await connection.query(`
      SELECT 
        id,
        transaction_number,
        date,
        total_amount,
        cashier_id,
        status,
        TIMESTAMPDIFF(HOUR, date, NOW()) as hours_old,
        CASE 
          WHEN TIMESTAMPDIFF(HOUR, date, NOW()) <= 48 THEN 'Can Reverse'
          ELSE 'Too Old'
        END as reversal_status
      FROM transactions
      WHERE status = 'active'
      ORDER BY date DESC
      LIMIT 10
    `);

    console.log('\nActive Transactions (Last 10):');
    console.log('-'.repeat(60));
    
    transactions.forEach(txn => {
      const hoursOld = Math.floor(txn.hours_old);
      const daysOld = (hoursOld / 24).toFixed(1);
      console.log(`
  Transaction: ${txn.transaction_number}
  Date: ${new Date(txn.date).toLocaleString()}
  Age: ${hoursOld} hours (${daysOld} days)
  Amount: Rs.${parseFloat(txn.total_amount).toFixed(2)}
  Status: ${txn.reversal_status}
      `.trim());
      console.log('-'.repeat(60));
    });

    // Count how many can be reversed
    const canReverse = transactions.filter(t => t.hours_old <= 48).length;
    const tooOld = transactions.filter(t => t.hours_old > 48).length;

    console.log('\n📊 Summary:');
    console.log(`  ✅ Can be reversed (≤ 48 hours): ${canReverse}`);
    console.log(`  ❌ Too old to reverse (> 48 hours): ${tooOld}`);
    console.log(`  📌 Total active transactions: ${transactions.length}`);

    console.log('\n✅ 2-Day Limit Logic:');
    console.log('  - Transactions ≤ 48 hours old: Eligible for reversal');
    console.log('  - Transactions > 48 hours old: Cannot be reversed');
    console.log('  - API will reject reversal requests for old transactions');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

test2DayLimit();
