const mysql = require('mysql2/promise');

async function checkDatabaseUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'smart_inventory'
  });

  try {
    console.log('Checking database users...');
    
    const [users] = await connection.execute('SELECT id, name, email, role FROM users');
    
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Check if owner exists
    const owner = users.find(u => u.role === 'owner');
    if (owner) {
      console.log(`\n✅ Owner found: ${owner.name} (${owner.email})`);
    } else {
      console.log('\n❌ No owner found in database');
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await connection.end();
  }
}

checkDatabaseUsers().catch(console.error);


