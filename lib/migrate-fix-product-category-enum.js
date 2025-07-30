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

    // Update any 'General' or NULL category to 'Other'
    await connection.execute(`UPDATE products SET category = 'Other' WHERE category IS NULL OR category = '' OR category = 'General'`);
    console.log('✅ Updated old category values to "Other".');

    // Change column to ENUM
    await connection.execute(`ALTER TABLE products MODIFY COLUMN category ENUM('Vegetables','Fruits','Other') DEFAULT 'Other'`);
    console.log('✅ category column set to ENUM with correct values.');

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate(); 