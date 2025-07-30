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

    // Check if is_active column exists
    const [columns] = await connection.execute(`SHOW COLUMNS FROM users LIKE 'is_active'`);
    if (columns.length === 0) {
      console.log('➕ Adding is_active column to users table...');
      await connection.execute(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
      console.log('✅ is_active column added.');
    } else {
      console.log('ℹ️ is_active column already exists.');
    }

    // Set all users to active if not already
    const [result] = await connection.execute(`UPDATE users SET is_active = TRUE WHERE is_active IS NULL OR is_active = FALSE`);
    console.log(`✅ Updated ${result.affectedRows} users to is_active = TRUE.`);

    // Show summary
    const [summary] = await connection.execute(`SELECT COUNT(*) as total, SUM(is_active = TRUE) as active, SUM(is_active = FALSE) as inactive FROM users`);
    console.log(`📊 Users: Total=${summary[0].total}, Active=${summary[0].active}, Inactive=${summary[0].inactive}`);

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate(); 