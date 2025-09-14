const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function checkTransactionsSchema() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    console.log('📊 Checking transactions table schema...');
    console.log('');

    // Check table structure
    const [columns] = await connection.execute(`
      DESCRIBE transactions
    `);

    console.log('📋 transactions table columns:');
    columns.forEach(column => {
      console.log(`   - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    console.log('');

    // Check if there are any existing records
    const [count] = await connection.execute(`
      SELECT COUNT(*) as count FROM transactions
    `);
    console.log(`📦 Total transactions records: ${count[0].count}`);

    if (count[0].count > 0) {
      const [sample] = await connection.execute(`
        SELECT * FROM transactions LIMIT 3
      `);
      console.log('📝 Sample records:');
      sample.forEach((record, index) => {
        console.log(`   Record ${index + 1}:`, record);
      });
    }

    // Check what fields the API is trying to insert
    console.log('');
    console.log('🔍 API Insert Query Analysis:');
    console.log('The API is trying to insert:');
    console.log('   - transaction_number');
    console.log('   - cashier_id');
    console.log('   - total_amount');
    console.log('   - payment_method');
    console.log('   - discount');
    console.log('   - notes');
    console.log('');

    // Check if all required fields exist
    const requiredFields = ['transaction_number', 'cashier_id', 'total_amount', 'payment_method', 'discount', 'notes'];
    const actualFields = columns.map(col => col.Field);
    
    const missingFields = requiredFields.filter(field => !actualFields.includes(field));
    const extraFields = actualFields.filter(field => !requiredFields.includes(field));

    if (missingFields.length === 0) {
      console.log('✅ All required fields exist in the transactions table');
    } else {
      console.log('❌ Missing required fields:');
      missingFields.forEach(field => {
        console.log(`   - ${field}`);
      });
    }

    if (extraFields.length > 0) {
      console.log('ℹ️  Extra fields in table:');
      extraFields.forEach(field => {
        console.log(`   - ${field}`);
      });
    }

  } catch (err) {
    console.error('❌ Error checking schema:', err.message);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkTransactionsSchema();
