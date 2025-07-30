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