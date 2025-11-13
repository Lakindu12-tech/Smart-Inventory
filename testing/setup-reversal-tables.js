require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function createReversalSystem() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_inventory'
  });

  try {
    console.log('✅ Connected to database\n');

    // Step 1: Update transactions.status ENUM to include 'reversed'
    console.log('Step 1: Updating transactions.status column...');
    try {
      await connection.query(`
        ALTER TABLE transactions 
        MODIFY COLUMN status ENUM('active', 'cancelled', 'refunded', 'reversed') DEFAULT 'active'
      `);
      console.log('✅ transactions.status updated to include "reversed"\n');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('ℹ️  Column already updated\n');
      } else {
        throw err;
      }
    }

    // Step 2: Create reversal_requests table
    console.log('Step 2: Creating reversal_requests table...');
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS reversal_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          transaction_id INT NOT NULL,
          transaction_number VARCHAR(50) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          cashier_id INT NOT NULL,
          cashier_reason TEXT NOT NULL,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          owner_comment TEXT,
          approved_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (transaction_id) REFERENCES transactions(id),
          FOREIGN KEY (cashier_id) REFERENCES users(id),
          FOREIGN KEY (approved_by) REFERENCES users(id)
        )
      `);
      console.log('✅ reversal_requests table created\n');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Table already exists\n');
      } else {
        throw err;
      }
    }

    // Step 3: Verify everything
    console.log('Step 3: Verifying setup...');
    const [statusCol] = await connection.query(
      "SHOW COLUMNS FROM transactions LIKE 'status'"
    );
    console.log('✅ transactions.status:', statusCol[0].Type);

    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'reversal_requests'"
    );
    console.log('✅ reversal_requests table exists:', tables.length > 0);

    if (tables.length > 0) {
      const [structure] = await connection.query('DESCRIBE reversal_requests');
      console.log('\n📋 reversal_requests table structure:');
      structure.forEach(col => {
        console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(30)} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL    '} ${col.Key || ''}`);
      });
    }

    console.log('\n🎉 Bill Reversal System successfully set up!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createReversalSystem();
