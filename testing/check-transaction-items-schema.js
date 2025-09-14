const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function checkTransactionItemsSchema() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    console.log('📊 Checking transaction_items table schema...');
    console.log('');

    // Check table structure
    const [columns] = await connection.execute(`
      DESCRIBE transaction_items
    `);

    console.log('📋 transaction_items table columns:');
    columns.forEach(column => {
      console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    console.log('');

    // Check if there are any existing records
    const [count] = await connection.execute(`
      SELECT COUNT(*) as count FROM transaction_items
    `);
    console.log(`📦 Total transaction_items records: ${count[0].count}`);

    if (count[0].count > 0) {
      const [sample] = await connection.execute(`
        SELECT * FROM transaction_items LIMIT 3
      `);
      console.log('📝 Sample records:');
      sample.forEach((record, index) => {
        console.log(`   Record ${index + 1}:`, record);
      });
    }

    // Check transactions table structure too
    console.log('');
    console.log('📊 Checking transactions table schema...');
    const [transactionColumns] = await connection.execute(`
      DESCRIBE transactions
    `);

    console.log('📋 transactions table columns:');
    transactionColumns.forEach(column => {
      console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });

  } catch (err) {
    console.error('❌ Error checking schema:', err.message);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkTransactionItemsSchema();
