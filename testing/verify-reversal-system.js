require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function verifyReversalSystem() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_inventory'
  });

  try {
    console.log('✅ Connected to database');

    // Check if status column exists in transactions table
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM transactions LIKE 'status'"
    );
    
    if (columns.length > 0) {
      console.log('✅ transactions.status column exists:', columns[0]);
    } else {
      console.log('❌ transactions.status column NOT found');
    }

    // Check if reversal_requests table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'reversal_requests'"
    );
    
    if (tables.length > 0) {
      console.log('✅ reversal_requests table exists');
      
      // Show table structure
      const [structure] = await connection.query('DESCRIBE reversal_requests');
      console.log('\nTable structure:');
      structure.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    } else {
      console.log('❌ reversal_requests table NOT found');
    }

    // Count any existing reversal requests
    const [count] = await connection.query(
      'SELECT COUNT(*) as count FROM reversal_requests'
    );
    console.log(`\n📊 Current reversal requests count: ${count[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

verifyReversalSystem();
