const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function cleanupDuplicateProducts() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    // Find duplicate products by name
    const [duplicates] = await connection.execute(`
      SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM products
      GROUP BY name
      HAVING COUNT(*) > 1
      ORDER BY name
    `);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate products found.');
      return;
    }

    console.log(`🔍 Found ${duplicates.length} products with duplicates:`);
    duplicates.forEach(dup => {
      console.log(`  - ${dup.name}: ${dup.count} copies (IDs: ${dup.ids})`);
    });

    console.log('\n🧹 Cleaning up duplicates...');

    for (const dup of duplicates) {
      const ids = dup.ids.split(',').map(id => parseInt(id.trim()));
      const [products] = await connection.execute(`
        SELECT id, name, stock, price, category, image_filename, created_at
        FROM products 
        WHERE id IN (${ids.join(',')})
        ORDER BY stock DESC, price DESC, created_at ASC
      `);

      // Keep the first product (highest stock, highest price, oldest)
      const keepId = products[0].id;
      const deleteIds = ids.filter(id => id !== keepId);

      console.log(`\n📦 Keeping product ID ${keepId} for "${dup.name}":`);
      console.log(`  - Stock: ${products[0].stock}kg`);
      console.log(`  - Price: Rs.${products[0].price}`);
      console.log(`  - Category: ${products[0].category}`);

      if (deleteIds.length > 0) {
        console.log(`🗑️  Deleting duplicate IDs: ${deleteIds.join(', ')}`);
        
        // Check if any of these products have stock movements
        for (const deleteId of deleteIds) {
          // Check stock movements
          const [movements] = await connection.execute(`
            SELECT COUNT(*) as count FROM stock_movements WHERE product_id = ?
          `, [deleteId]);
          
          if (movements[0].count > 0) {
            console.log(`  ⚠️  Product ID ${deleteId} has ${movements[0].count} stock movements - transferring to kept product`);
            
            // Transfer stock movements to the kept product
            await connection.execute(`
              UPDATE stock_movements SET product_id = ? WHERE product_id = ?
            `, [keepId, deleteId]);
          }

          // Check product requests
          const [requests] = await connection.execute(`
            SELECT COUNT(*) as count FROM product_requests WHERE product_id = ?
          `, [deleteId]);
          
          if (requests[0].count > 0) {
            console.log(`  ⚠️  Product ID ${deleteId} has ${requests[0].count} product requests - transferring to kept product`);
            
            // Transfer product requests to the kept product
            await connection.execute(`
              UPDATE product_requests SET product_id = ? WHERE product_id = ?
            `, [keepId, deleteId]);
          }

          // Check transaction items
          const [transactions] = await connection.execute(`
            SELECT COUNT(*) as count FROM transaction_items WHERE product_id = ?
          `, [deleteId]);
          
          if (transactions[0].count > 0) {
            console.log(`  ⚠️  Product ID ${deleteId} has ${transactions[0].count} transaction items - transferring to kept product`);
            
            // Transfer transaction items to the kept product
            await connection.execute(`
              UPDATE transaction_items SET product_id = ? WHERE product_id = ?
            `, [keepId, deleteId]);
          }
        }

        // Delete duplicate products
        await connection.execute(`
          DELETE FROM products WHERE id IN (${deleteIds.join(',')})
        `);
        
        console.log(`✅ Deleted ${deleteIds.length} duplicate products`);
      }
    }

    console.log('\n🎉 Duplicate cleanup completed!');
    
    // Show final product list
    const [finalProducts] = await connection.execute(`
      SELECT id, name, stock, price, category
      FROM products
      ORDER BY name
    `);
    
    console.log('\n📦 Final product list:');
    finalProducts.forEach(product => {
      console.log(`  - ID ${product.id}: ${product.name} - Stock: ${product.stock}kg - Price: Rs.${product.price} - Category: ${product.category}`);
    });

  } catch (err) {
    console.error('❌ Error cleaning up duplicates:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

cleanupDuplicateProducts();
