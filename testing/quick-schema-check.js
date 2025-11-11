const mysql = require('mysql2/promise');

async function checkSchema() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'lakindu',
    database: 'smart_inventory'
  });

  console.log('Checking transaction_items table schema...\n');
  
  const [cols] = await conn.execute('DESCRIBE transaction_items');
  console.log('Columns:');
  cols.forEach(c => {
    console.log(`  ${c.Field.padEnd(20)} ${c.Type.padEnd(20)} ${c.Null} ${c.Key} ${c.Default || ''}`);
  });

  console.log('\nChecking sample data...');
  const [rows] = await conn.execute('SELECT * FROM transaction_items LIMIT 1');
  if (rows.length > 0) {
    console.log('\nSample row keys:', Object.keys(rows[0]));
  }

  await conn.end();
}

checkSchema().catch(console.error);
