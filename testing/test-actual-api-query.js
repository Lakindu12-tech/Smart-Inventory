require('dotenv').config();
const mysql = require('mysql2/promise');

async function testActualQuery() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const days = 30;
  
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
  
  console.log('📊 Total rows:', txRows.length);
  console.log('');
  
  // Show first few rows
  console.log('First 3 rows:');
  txRows.slice(0, 3).forEach(row => {
    console.log(row);
  });
  console.log('');
  
  // Show last 3 rows (your papaya transactions)
  console.log('Last 3 rows (recent transactions):');
  txRows.slice(-3).forEach(row => {
    console.log(row);
  });
  console.log('');
  
  // Build product performance map
  const productPerfMap = {};
  for (const row of txRows) {
    if (row.product_id) {
      const pid = String(row.product_id);
      if (!productPerfMap[pid]) {
        productPerfMap[pid] = { 
          productId: row.product_id, 
          name: row.product_name, 
          quantity: 0, 
          totalSales: 0 
        };
      }
      productPerfMap[pid].quantity += Number(row.quantity || 0);
      productPerfMap[pid].totalSales += Number(row.quantity || 0) * Number(row.price || 0);
      
      console.log(`Adding to product ${row.product_name}: qty=${row.quantity}, price=${row.price}, subtotal=${Number(row.quantity) * Number(row.price)}`);
    }
  }
  
  console.log('');
  console.log('📦 Product Performance:');
  Object.values(productPerfMap).forEach(p => {
    console.log(`  ${p.name}: ${p.quantity} units, Rs.${p.totalSales}`);
  });
  
  await conn.end();
}

testActualQuery();
