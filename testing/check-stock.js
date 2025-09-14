const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function checkStock() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    // Check if stock_movements table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'stock_movements'
    `, [dbConfig.database]);
    
    if (tables.length === 0) {
      console.log('❌ stock_movements table does not exist!');
      return;
    }

    // Get all products with their current stock calculation
    const [products] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.stock as base_stock,
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) as stock_in,
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as stock_out,
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as calculated_stock
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id
      ORDER BY p.name
    `);
    
    console.log(`📦 Found ${products.length} products with stock information:`);
    console.log('');
    
    products.forEach(product => {
      console.log(`Product: ${product.name}`);
      console.log(`  - Base Stock: ${product.base_stock}kg`);
      console.log(`  - Stock In: ${product.stock_in}kg`);
      console.log(`  - Stock Out: ${product.stock_out}kg`);
      console.log(`  - Calculated Stock: ${product.calculated_stock}kg`);
      console.log('');
    });

    // Check stock movements
    const [movements] = await connection.execute(`
      SELECT 
        sm.id,
        p.name as product_name,
        sm.movement_type,
        sm.quantity,
        sm.status,
        sm.reason,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ORDER BY sm.created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 Recent stock movements (${movements.length}):`);
    movements.forEach(movement => {
      console.log(`  - ${movement.product_name}: ${movement.movement_type} ${movement.quantity}kg (${movement.status}) - ${movement.reason}`);
    });
    
  } catch (err) {
    console.error('❌ Error checking stock:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkStock();
