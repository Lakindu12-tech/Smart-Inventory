require('dotenv').config();
const mysql = require('mysql2/promise');

async function testUpdatedAPI() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const days = 30;
  
  // Get transactions
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
  
  // Build product performance
  const productPerfMap = {};
  for (const row of txRows) {
    if (row.product_id) {
      const pid = String(row.product_id);
      if (!productPerfMap[pid]) {
        productPerfMap[pid] = { 
          productId: row.product_id, 
          name: row.product_name, 
          category: row.category || 'Other',
          quantity: 0, 
          totalSales: 0,
          total_sold: 0,
          total_revenue: 0
        };
      }
      const itemRevenue = Number(row.quantity || 0) * Number(row.price || 0);
      productPerfMap[pid].quantity += Number(row.quantity || 0);
      productPerfMap[pid].totalSales += itemRevenue;
      productPerfMap[pid].total_sold += Number(row.quantity || 0);
      productPerfMap[pid].total_revenue += itemRevenue;
    }
  }
  
  // Get inventory
  const [inventoryRows] = await conn.execute(
    `SELECT p.id, p.name, p.price, COALESCE(p.stock,0) as base_stock, p.category,
            COALESCE(SUM(CASE WHEN sm.status='approved' AND sm.movement_type='in' THEN sm.quantity ELSE 0 END),0) as stock_in,
            COALESCE(SUM(CASE WHEN sm.status='approved' AND sm.movement_type='out' THEN sm.quantity ELSE 0 END),0) as stock_out
     FROM products p
     LEFT JOIN stock_movements sm ON p.id = sm.product_id
     GROUP BY p.id, p.name, p.price, p.category`,
    []
  );
  
  const inventoryMap = {};
  inventoryRows.forEach(r => {
    inventoryMap[String(r.id)] = {
      id: r.id,
      name: r.name,
      current_stock: Number(r.base_stock || 0) + Number(r.stock_in || 0) - Number(r.stock_out || 0),
      category: r.category
    };
  });
  
  // Merge inventory into product performance
  Object.keys(productPerfMap).forEach(pid => {
    const inv = inventoryMap[pid];
    if (inv) {
      productPerfMap[pid].current_stock = inv.current_stock;
      productPerfMap[pid].category = inv.category;
      if (inv.current_stock <= 0) {
        productPerfMap[pid].stock_status = 'Out of Stock';
      } else if (inv.current_stock <= 10) {
        productPerfMap[pid].stock_status = 'Low Stock';
      } else {
        productPerfMap[pid].stock_status = 'In Stock';
      }
    } else {
      productPerfMap[pid].current_stock = 0;
      productPerfMap[pid].stock_status = 'Out of Stock';
    }
  });
  
  console.log('📦 Updated Product Performance:');
  Object.values(productPerfMap).forEach(p => {
    console.log(p);
  });
  
  await conn.end();
}

testUpdatedAPI();
