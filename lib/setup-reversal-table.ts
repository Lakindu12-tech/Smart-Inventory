import { getConnection } from './database';

export async function setupReversalTable() {
  const connection = await getConnection();
  
  try {
    // Add status column to transactions table if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE transactions 
        ADD COLUMN status ENUM('active', 'reversed') DEFAULT 'active',
        ADD COLUMN transaction_number VARCHAR(50) DEFAULT NULL,
        ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash',
        ADD COLUMN payment_status VARCHAR(50) DEFAULT 'completed',
        ADD COLUMN discount DECIMAL(10,2) DEFAULT 0
      `);
      console.log('✅ Added status and other fields to transactions table');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Transactions table fields already exist');
      } else {
        throw error;
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
    
  } catch (error) {
    console.error('❌ Error setting up reversal table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupReversalTable().catch(console.error);
}
