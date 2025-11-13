import { getConnection } from './database';
import { hashPassword } from './auth';

export async function setupDatabase() {
  const connection = await getConnection();
  
  try {
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('owner', 'storekeeper', 'cashier') NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_active column if it doesn't exist (for existing databases)
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE
      `);
    } catch (error) {
      // Column already exists, ignore error
    }

    // Create products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) DEFAULT NULL,
        stock INT DEFAULT 0,
        category VARCHAR(100) DEFAULT 'General',
        image_filename VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        total_amount DECIMAL(10,2) NOT NULL,
        cashier_id INT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cashier_id) REFERENCES users(id)
      )
    `);

    // Create transaction_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Add status column to transactions if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE transactions 
        ADD COLUMN status ENUM('active', 'reversed') DEFAULT 'active'
      `);
    } catch (error) {
      // Column already exists, ignore
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

    // Create default owner user
    const hashedPassword = await hashPassword('admin123');
    await connection.execute(`
      INSERT IGNORE INTO users (name, email, password, role) 
      VALUES ('System Owner', 'admin@inventory.com', ?, 'owner')
    `, [hashedPassword]);

    console.log('Database setup completed successfully!');
    console.log('Default admin credentials:');
    console.log('Email: admin@inventory.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  } finally {
    await connection.end();
  }
} 