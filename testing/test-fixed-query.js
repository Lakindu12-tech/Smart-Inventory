require('dotenv').config();
const mysql = require('mysql2/promise');

async function testFixedQuery() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const days = 30;
  
  console.log(`🔍 Testing fixed query with ${days} days...`);
  console.log('');
  
  const [txRows] = await conn.execute(
    `SELECT t.id, t.date, t.total_amount, t.payment_method, t.cashier_id, u.name as cashier_name,
            ti.product_id, p.name as product_name, ti.quantity, ti.unit_price as price, p.category
     FROM transactions t
     LEFT JOIN users u ON t.cashier_id = u.id
     LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
     LEFT JOIN products p ON ti.product_id = p.id
     WHERE t.date >= DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY t.date ASC`,
    [days]
  );
  
  console.log('📊 Query returned', txRows.length, 'rows');
  console.log('');
  
  // Build transactions grouped
  const txMap = {};
  for (const row of txRows) {
    if (!txMap[row.id]) {
      txMap[row.id] = {
        id: row.id,
        date: row.date,
        total_amount: row.total_amount,
        payment_method: row.payment_method,
        cashier_id: row.cashier_id,
        cashier_name: row.cashier_name,
        items: []
      };
    }
    if (row.product_id) {
      txMap[row.id].items.push({
        product_id: row.product_id,
        product_name: row.product_name,
        category: row.category,
        quantity: row.quantity,
        price: row.price
      });
    }
  }
  
  const transactions = Object.values(txMap);
  console.log('📦 Unique transactions:', transactions.length);
  console.log('');
  
  transactions.forEach(tx => {
    console.log(`Transaction ${tx.id}: Rs.${tx.total_amount} on ${new Date(tx.date).toLocaleString()}`);
    tx.items.forEach(item => {
      console.log(`  - ${item.product_name}: ${item.quantity} x Rs.${item.price} = Rs.${item.quantity * item.price}`);
    });
  });
  console.log('');
  
  const totalSales = transactions.reduce((s, t) => s + Number(t.total_amount || 0), 0);
  console.log('💰 Total Sales: Rs.' + totalSales);
  console.log('🧾 Total Transactions:', transactions.length);
  console.log('📊 Average: Rs.' + (totalSales / transactions.length).toFixed(2));
  
  await conn.end();
}

testFixedQuery();
