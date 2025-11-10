require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTimezone() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const [tz] = await conn.execute('SELECT @@global.time_zone, @@session.time_zone, NOW() as db_now, UTC_TIMESTAMP() as utc_now');
  console.log('Database timezone settings:');
  console.log(tz[0]);
  console.log('');
  
  const [tx] = await conn.execute('SELECT id, date, DATE_ADD(date, INTERVAL 0 SECOND) as date_local FROM transactions WHERE id IN (10, 11, 12) ORDER BY id');
  console.log('Recent transactions (IDs 10-12):');
  tx.forEach(t => {
    console.log(`  ID ${t.id}: ${t.date} (stored) -> ${t.date_local} (local)`);
  });
  console.log('');
  
  const now = new Date();
  const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  console.log('JavaScript dates:');
  console.log('  Now:', now.toISOString());
  console.log('  30d ago:', start30d.toISOString());
  console.log('');
  
  // Try query with current dates
  const [result1] = await conn.execute(
    'SELECT COUNT(*) as count FROM transactions WHERE date >= ? AND date <= ?',
    [start30d.toISOString(), now.toISOString()]
  );
  console.log('Query with JS dates (ISO):', result1[0].count, 'transactions');
  
  // Try query without time zone conversion
  const [result2] = await conn.execute(
    'SELECT COUNT(*) as count FROM transactions WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
  );
  console.log('Query with DATE_SUB(NOW(), 30):', result2[0].count, 'transactions');
  
  // Try query with UTC_TIMESTAMP
  const [result3] = await conn.execute(
    'SELECT COUNT(*) as count FROM transactions WHERE date >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)'
  );
  console.log('Query with DATE_SUB(UTC_TIMESTAMP(), 30):', result3[0].count, 'transactions');
  
  await conn.end();
}

checkTimezone();
