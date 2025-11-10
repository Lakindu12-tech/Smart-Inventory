require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugDates() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  console.log('Current server time:', new Date().toISOString());
  console.log('30 days ago:', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  console.log('');
  
  const [allTx] = await conn.execute('SELECT id, date, total_amount FROM transactions ORDER BY date DESC');
  console.log('All transactions in database:');
  allTx.forEach(tx => {
    console.log(`  ID ${tx.id}: ${tx.date.toISOString()} - Rs.${tx.total_amount}`);
  });
  console.log('');
  
  const now = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startStr = start.toISOString();
  const endStr = now.toISOString();
  
  console.log('Querying with:');
  console.log('  Start:', startStr);
  console.log('  End:', endStr);
  console.log('');
  
  const [filtered] = await conn.execute(
    'SELECT id, date, total_amount FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startStr, endStr]
  );
  
  console.log('Filtered transactions (30d):');
  filtered.forEach(tx => {
    console.log(`  ID ${tx.id}: ${tx.date.toISOString()} - Rs.${tx.total_amount}`);
  });
  console.log('');
  console.log('Total filtered:', filtered.length);
  
  await conn.end();
}

debugDates();
