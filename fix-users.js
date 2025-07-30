const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smart_inventory'
};

async function fixUsers() {
  console.log('Connecting to database...');
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');
    // Print all users
    const [users] = await connection.execute('SELECT id, name, email, role FROM users');
    if (!users || users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log('Current users:');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    // Fix storekeeper password
    const storekeeperHash = bcrypt.hashSync('1234', 10);
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [storekeeperHash, 'storekeeper@test.com']
    );
    console.log('Fixed storekeeper password');
    
    // Fix cashier password
    const cashierHash = bcrypt.hashSync('1234', 10);
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [cashierHash, 'cashier@test.com']
    );
    console.log('Fixed cashier password');
    
    // Print all users again
    const [updatedUsers] = await connection.execute('SELECT id, name, email, role FROM users');
    if (!updatedUsers || updatedUsers.length === 0) {
      console.log('No users found after update.');
    } else {
      console.log('\nUpdated users:');
      updatedUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
    if (error && error.stack) console.error(error.stack);
  } finally {
    if (connection) await connection.end();
  }
}

fixUsers(); 