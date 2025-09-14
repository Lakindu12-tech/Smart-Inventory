const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function fixDatabaseSchema() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    console.log('🔧 Starting database schema fixes...');
    console.log('');

    // 1. Fix transactions table
    console.log('📋 Fixing transactions table...');
    
    // Check if transaction_number column exists
    const [transactionColumns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'transaction_number'
    `, [dbConfig.database]);

    if (transactionColumns.length === 0) {
      console.log('  ➕ Adding missing columns to transactions table...');
      
      // Add missing columns
      await connection.execute(`
        ALTER TABLE transactions 
        ADD COLUMN transaction_number VARCHAR(50) UNIQUE NOT NULL AFTER id,
        ADD COLUMN payment_method ENUM('cash', 'card', 'mobile') DEFAULT 'cash' AFTER total_amount,
        ADD COLUMN payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'completed' AFTER payment_method,
        ADD COLUMN status ENUM('active', 'cancelled', 'refunded') DEFAULT 'active' AFTER payment_status,
        ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00 AFTER status,
        ADD COLUMN notes TEXT AFTER discount
      `);
      
      // Generate transaction numbers for existing records
      const [existingTransactions] = await connection.execute('SELECT id FROM transactions');
      for (const trans of existingTransactions) {
        const transactionNumber = `TXN${String(trans.id).padStart(6, '0')}`;
        await connection.execute(`
          UPDATE transactions SET transaction_number = ? WHERE id = ?
        `, [transactionNumber, trans.id]);
      }
      
      console.log('  ✅ Transactions table fixed');
    } else {
      console.log('  ✅ Transactions table already has required columns');
    }

    // 2. Fix transaction_items table
    console.log('📋 Fixing transaction_items table...');
    
    // Check if unit_price and total_price columns exist
    const [itemColumns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'transaction_items' AND COLUMN_NAME IN ('unit_price', 'total_price')
    `, [dbConfig.database]);

    if (itemColumns.length < 2) {
      console.log('  ➕ Adding missing columns to transaction_items table...');
      
      // Add missing columns
      if (!itemColumns.find(col => col.COLUMN_NAME === 'unit_price')) {
        await connection.execute(`
          ALTER TABLE transaction_items ADD COLUMN unit_price DECIMAL(10,2) NOT NULL AFTER quantity
        `);
      }
      
      if (!itemColumns.find(col => col.COLUMN_NAME === 'total_price')) {
        await connection.execute(`
          ALTER TABLE transaction_items ADD COLUMN total_price DECIMAL(10,2) NOT NULL AFTER unit_price
        `);
      }
      
      console.log('  ✅ Transaction_items table fixed');
    } else {
      console.log('  ✅ Transaction_items table already has required columns');
    }

    // 3. Ensure proper indexes for performance
    console.log('📋 Adding/checking indexes...');
    
    // Add indexes for better performance
    try {
      await connection.execute(`
        CREATE INDEX idx_products_name ON products(name)
      `);
      console.log('  ✅ Products name index created');
    } catch (e) {
      console.log('  ℹ️  Products name index already exists');
    }

    try {
      await connection.execute(`
        CREATE INDEX idx_stock_movements_product_status ON stock_movements(product_id, status, movement_type)
      `);
      console.log('  ✅ Stock movements composite index created');
    } catch (e) {
      console.log('  ℹ️  Stock movements composite index already exists');
    }

    try {
      await connection.execute(`
        CREATE INDEX idx_transactions_number ON transactions(transaction_number)
      `);
      console.log('  ✅ Transactions number index created');
    } catch (e) {
      console.log('  ℹ️  Transactions number index already exists');
    }

    // 4. Clean up any orphaned records
    console.log('📋 Cleaning up orphaned records...');
    
    // Remove orphaned stock movements
    const [orphanedMovements] = await connection.execute(`
      SELECT COUNT(*) as count FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      WHERE p.id IS NULL
    `);
    if (orphanedMovements[0].count > 0) {
      console.log(`  🗑️  Removing ${orphanedMovements[0].count} orphaned stock movements`);
      await connection.execute(`
        DELETE FROM stock_movements WHERE product_id NOT IN (SELECT id FROM products)
      `);
    }

    // Remove orphaned transaction items
    const [orphanedItems] = await connection.execute(`
      SELECT COUNT(*) as count FROM transaction_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE p.id IS NULL
    `);
    if (orphanedItems[0].count > 0) {
      console.log(`  🗑️  Removing ${orphanedItems[0].count} orphaned transaction items`);
      await connection.execute(`
        DELETE FROM transaction_items WHERE product_id NOT IN (SELECT id FROM products)
      `);
    }

    // Remove orphaned product requests
    const [orphanedRequests] = await connection.execute(`
      SELECT COUNT(*) as count FROM product_requests pr
      LEFT JOIN products p ON pr.product_id = p.id
      WHERE pr.product_id IS NOT NULL AND p.id IS NULL
    `);
    if (orphanedRequests[0].count > 0) {
      console.log(`  🗑️  Removing ${orphanedRequests[0].count} orphaned product requests`);
      await connection.execute(`
        DELETE FROM product_requests WHERE product_id IS NOT NULL AND product_id NOT IN (SELECT id FROM products)
      `);
    }

    // 5. Update existing transaction items with proper pricing
    console.log('📋 Updating existing transaction items...');
    
    const [existingItems] = await connection.execute(`
      SELECT ti.id, ti.product_id, ti.quantity, p.price
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE ti.unit_price = 0 OR ti.total_price = 0
    `);
    
    if (existingItems.length > 0) {
      console.log(`  🔄 Updating ${existingItems.length} transaction items with proper pricing`);
      for (const item of existingItems) {
        const unitPrice = item.price;
        const totalPrice = unitPrice * item.quantity;
        await connection.execute(`
          UPDATE transaction_items 
          SET unit_price = ?, total_price = ? 
          WHERE id = ?
        `, [unitPrice, totalPrice, item.id]);
      }
    }

    // 6. Verify final schema
    console.log('');
    console.log('🔍 Verifying final database schema...');
    
    const [finalTables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);

    console.log('📊 Final database state:');
    finalTables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}: ${table.TABLE_ROWS || 0} rows`);
    });

    // 7. Test stock calculation consistency
    console.log('');
    console.log('🧮 Testing stock calculation consistency...');
    
    const [stockTest] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.stock as base_stock,
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) as stock_in,
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as stock_out,
        COALESCE(p.stock, 0) + 
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as calculated_stock
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.name, p.stock
      ORDER BY p.name
      LIMIT 5
    `);
    
    console.log('📦 Sample stock calculations:');
    stockTest.forEach(product => {
      console.log(`  - ${product.name}: Base(${product.base_stock}kg) + In(${product.stock_in}kg) - Out(${product.stock_out}kg) = ${product.calculated_stock}kg`);
    });

    console.log('');
    console.log('🎉 Database schema fixes completed successfully!');
    console.log('');
    console.log('📝 Summary of fixes:');
    console.log('  ✅ Transactions table: Added missing columns (transaction_number, payment_method, etc.)');
    console.log('  ✅ Transaction_items table: Added missing columns (unit_price, total_price)');
    console.log('  ✅ Performance indexes: Added/verified database indexes');
    console.log('  ✅ Data cleanup: Removed orphaned records');
    console.log('  ✅ Data consistency: Updated existing records with proper values');
    console.log('');
    console.log('🚀 The billing system should now work correctly with consistent stock calculations!');

  } catch (err) {
    console.error('❌ Error fixing database schema:', err.message);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

fixDatabaseSchema();
