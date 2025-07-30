const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smart_inventory'
};

async function checkUsers() {
  console.log('Connecting to database...');
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');
    
    // Check all users
    const [users] = await connection.execute('SELECT id, name, email, role, password FROM users');
    console.log('\nAll users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
    });
    
    // Check if storekeeper exists
    const [storekeepers] = await connection.execute(
      'SELECT id, name, email, role, password FROM users WHERE email = ?', 
      ['lakinduabeyrathne2002@gmail.com']
    );
    
    if (storekeepers.length > 0) {
      console.log('\nStorekeeper found:');
      console.log(`- ${storekeepers[0].name} (${storekeepers[0].email}) - ${storekeepers[0].role}`);
      console.log(`  Password hash: ${storekeepers[0].password.substring(0, 20)}...`);
    } else {
      console.log('\nNo storekeeper found with email: lakinduabeyrathne2002@gmail.com');
    }
    
  } catch (error) {
    console.error('Error:', error);
    if (error && error.stack) console.error(error.stack);
  } finally {
    if (connection) await connection.end();
  }
}

checkUsers(); 