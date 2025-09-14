const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function checkProducts() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    // Get all products
    const [products] = await connection.execute('SELECT id, name, category FROM products');
    console.log(`📦 Found ${products.length} products:`);
    
    products.forEach(product => {
      console.log(`  - ${product.name} (${product.category})`);
    });
    
  } catch (err) {
    console.error('❌ Error checking products:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkProducts();
