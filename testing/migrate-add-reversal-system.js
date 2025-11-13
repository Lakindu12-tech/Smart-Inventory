require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupReversalTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_inventory'
  });
  
  try {
    console.log('🔌 Connecting to database...');
    
    // Add status column to transactions table if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE transactions 
        ADD COLUMN status ENUM('active', 'reversed') DEFAULT 'active'
      `);
      console.log('✅ Added status field to transactions table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Status field already exists in transactions table');
      } else {
        console.log('⚠️  Error adding status field:', error.message);
      }
    }

    // Create reversal_requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reversal_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        transaction_number VARCHAR(50) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        cashier_id INT NOT NULL,
        cashier_reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        owner_comment TEXT DEFAULT NULL,
        approved_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (cashier_id) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);
    
    console.log('✅ Reversal requests table created successfully!');
    console.log('');
    console.log('📋 Table structure:');
    console.log('   - id: Auto increment primary key');
    console.log('   - transaction_id: Reference to transaction');
    console.log('   - transaction_number: Transaction number for display');
    console.log('   - total_amount: Amount to be reversed');
    console.log('   - cashier_id: Who requested the reversal');
    console.log('   - cashier_reason: Why reversal is needed (required)');
    console.log('   - status: pending/approved/rejected');
    console.log('   - owner_comment: Owner\'s comment when approving/rejecting');
    console.log('   - approved_by: Owner who approved/rejected');
    console.log('');
    console.log('🎉 Database migration completed!');
    
  } catch (error) {
    console.error('❌ Error setting up reversal table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
setupReversalTable().catch(console.error);
