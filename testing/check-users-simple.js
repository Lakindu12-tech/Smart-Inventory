const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({ 
    host: 'localhost', 
    user: 'root', 
    password: 'lakindu', 
    database: 'smart_inventory' 
  });
  
  const [users] = await conn.execute('SELECT name, email, role FROM users WHERE is_active = TRUE');
  console.log('\n✅ Active Users in Database:\n');
  users.forEach(u => {
    console.log(`  👤 ${u.name}`);
    console.log(`     Email: ${u.email}`);
    console.log(`     Role: ${u.role}\n`);
  });
  
  await conn.end();
})();
