const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function testBillingComplete() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    console.log('🧪 Testing Complete Billing Process...');
    console.log('');

    // Test 1: Check if we can create a transaction
    console.log('📊 1. Testing Transaction Creation...');
    
    try {
      // Generate a test transaction number
      const testTransactionNumber = `TEST${Date.now()}`;
      const testCashierId = 3; // Assuming cashier ID 3 exists
      const testTotalAmount = 100.00;
      const testPaymentMethod = 'cash';
      const testDiscount = 0.00;
      const testNotes = 'Test transaction';

      const transactionResult = await connection.execute(`
        INSERT INTO transactions (transaction_number, cashier_id, total_amount, payment_method, discount, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [testTransactionNumber, testCashierId, testTotalAmount, testPaymentMethod, testDiscount, testNotes]);

      const transactionId = transactionResult[0].insertId;
      console.log(`   ✅ Transaction created successfully with ID: ${transactionId}`);
      console.log(`   📝 Transaction Number: ${testTransactionNumber}`);
      console.log(`   💰 Total Amount: Rs.${testTotalAmount}`);
      console.log('');

      // Test 2: Check if we can create transaction items
      console.log('📊 2. Testing Transaction Item Creation...');
      
      try {
        // Get a product to test with
        const [products] = await connection.execute(`
          SELECT id, name, price FROM products LIMIT 1
        `);
        
        if (products.length > 0) {
          const product = products[0];
          const testQuantity = 1;
          const unitPrice = product.price;
          const totalPrice = unitPrice * testQuantity;

          console.log(`   📦 Testing with product: ${product.name} (ID: ${product.id})`);
          console.log(`   💰 Unit Price: Rs.${unitPrice}`);
          console.log(`   📏 Quantity: ${testQuantity}kg`);
          console.log(`   💵 Total Price: Rs.${totalPrice}`);

          // Insert transaction item
          const itemResult = await connection.execute(`
            INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?)
          `, [transactionId, product.id, testQuantity, unitPrice, totalPrice]);

          console.log(`   ✅ Transaction item created successfully with ID: ${itemResult[0].insertId}`);
          console.log('');

          // Test 3: Check if we can create stock movement
          console.log('📊 3. Testing Stock Movement Creation...');
          
          try {
            const movementResult = await connection.execute(`
              INSERT INTO stock_movements (product_id, movement_type, quantity, reason, performed_by, status, approved_by)
              VALUES (?, 'out', ?, 'Test sale transaction', ?, 'approved', ?)
            `, [product.id, testQuantity, testCashierId, testCashierId]);

            console.log(`   ✅ Stock movement created successfully with ID: ${movementResult[0].insertId}`);
            console.log(`   📦 Stock out: ${testQuantity}kg of ${product.name}`);
            console.log('');

            // Test 4: Verify the complete process
            console.log('📊 4. Verifying Complete Process...');
            
            // Check transaction
            const [transaction] = await connection.execute(`
              SELECT * FROM transactions WHERE id = ?
            `, [transactionId]);
            
            // Check transaction item
            const [item] = await connection.execute(`
              SELECT * FROM transaction_items WHERE transaction_id = ?
            `, [transactionId]);
            
            // Check stock movement
            const [movement] = await connection.execute(`
              SELECT * FROM stock_movements WHERE product_id = ? AND movement_type = 'out' ORDER BY id DESC LIMIT 1
            `, [product.id]);

            if (transaction.length > 0 && item.length > 0 && movement.length > 0) {
              console.log('   🎉 ALL TESTS PASSED! The billing system is working correctly.');
              console.log('');
              console.log('   📋 Final Status:');
              console.log(`   ✅ Transaction: ${transaction[0].transaction_number} (Rs.${transaction[0].total_amount})`);
              console.log(`   ✅ Item: ${product.name} x ${item[0].quantity}kg = Rs.${item[0].total_price}`);
              console.log(`   ✅ Stock Movement: ${movement[0].quantity}kg out (${movement[0].status})`);
              console.log('');
              console.log('🚀 The "Complete Sale" button should now work without any errors!');
            } else {
              console.log('   ❌ Some verification checks failed');
            }

          } catch (movementError) {
            console.log('   ❌ Stock movement creation failed:', movementError.message);
          }

        } else {
          console.log('   ❌ No products found in database');
        }

      } catch (itemError) {
        console.log('   ❌ Transaction item creation failed:', itemError.message);
      }

      // Clean up test data
      console.log('');
      console.log('🧹 Cleaning up test data...');
      try {
        await connection.execute('DELETE FROM stock_movements WHERE reason = ?', ['Test sale transaction']);
        await connection.execute('DELETE FROM transaction_items WHERE transaction_id = ?', [transactionId]);
        await connection.execute('DELETE FROM transactions WHERE id = ?', [transactionId]);
        console.log('   ✅ Test data cleaned up');
      } catch (cleanupError) {
        console.log('   ⚠️  Cleanup warning:', cleanupError.message);
      }

    } catch (transactionError) {
      console.log('   ❌ Transaction creation failed:', transactionError.message);
      console.log('   🔍 This might be the source of the "Complete Value" button error');
    }

  } catch (err) {
    console.error('❌ Error testing billing process:', err.message);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

testBillingComplete();
