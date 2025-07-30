const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'lakindu',
  database: 'smart_inventory'
};

async function testConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('Database connection successful:', rows);
    await connection.end();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

testConnection(); 