const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function testProductsAPI() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    // Test the same query that the products API now uses
    const [products] = await connection.execute(`
      SELECT 
        p.*,
        COALESCE(p.stock, 0) + 
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as current_stock
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.name, p.price, p.stock, p.category, p.image_filename, p.created_at
      ORDER BY p.name ASC
    `);
    
    console.log(`📦 Found ${products.length} products with calculated stock:`);
    console.log('');
    
    products.forEach(product => {
      console.log(`Product: ${product.name}`);
      console.log(`  - ID: ${product.id}`);
      console.log(`  - Base Stock: ${product.stock || 0}kg`);
      console.log(`  - Calculated Current Stock: ${product.current_stock}kg`);
      console.log(`  - Price: Rs.${product.price || 0}`);
      console.log(`  - Category: ${product.category || 'N/A'}`);
      console.log('');
    });

    // Check specifically for Papaya
    const papayaProducts = products.filter(p => p.name.toLowerCase().includes('papaya'));
    if (papayaProducts.length > 0) {
      console.log('🍈 Papaya Products Found:');
      papayaProducts.forEach(papaya => {
        console.log(`  - ID ${papaya.id}: ${papaya.name} - Stock: ${papaya.current_stock}kg`);
      });
    } else {
      console.log('❌ No Papaya products found');
    }
    
  } catch (err) {
    console.error('❌ Error testing products API:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

testProductsAPI();
