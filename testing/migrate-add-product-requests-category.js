const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function migrate() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    // Add category column if not exists
    const [columns] = await connection.execute(`SHOW COLUMNS FROM product_requests LIKE 'category'`);
    if (columns.length === 0) {
      console.log('➕ Adding category column to product_requests table...');
      await connection.execute(`ALTER TABLE product_requests ADD COLUMN category ENUM('Vegetables','Fruits','Other') DEFAULT 'Other'`);
      console.log('✅ category column added.');
    } else {
      console.log('ℹ️ category column already exists.');
    }

    // Update existing rows with NULL or empty category to 'Other'
    await connection.execute(`UPDATE product_requests SET category = 'Other' WHERE category IS NULL OR category = ''`);
    console.log('✅ Updated existing product_requests with missing category to "Other".');

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();


