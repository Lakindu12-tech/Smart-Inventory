const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({ 
    host: 'localhost', 
    user: 'root', 
    password: 'lakindu', 
    database: 'smart_inventory' 
  });
  
  const [columns] = await conn.execute('SHOW COLUMNS FROM transactions');
  console.log('\n📋 Transactions Table Columns:\n');
  columns.forEach(c => {
    console.log(`  - ${c.Field} (${c.Type})`);
  });
  
  const [sample] = await conn.execute('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 1');
  if (sample.length > 0) {
    console.log('\n📄 Sample Transaction:\n');
    console.log(JSON.stringify(sample[0], null, 2));
  }
  
  await conn.end();
})();
