import 'dotenv/config';
import { getConnection } from '../lib/database';

async function testAnalyticsData() {
  console.log('🔍 Testing Analytics Data...\n');
  
  const conn = await getConnection();
  
  try {
    // Check transactions
    const [txRows] = await conn.execute(`
      SELECT t.id, t.date, t.total_amount, t.payment_method, t.cashier_id, u.name as cashier_name,
             ti.product_id, p.name as product_name, ti.quantity, ti.unit_price as price, p.category
      FROM transactions t
      LEFT JOIN users u ON t.cashier_id = u.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE t.date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY t.date DESC
    `);
    
    console.log('📊 Transactions in last 30 days:', (txRows as any[]).length);
    console.log('Sample transaction:', (txRows as any[])[0]);
    console.log('');
    
    // Build transactions grouped
    const txMap: Record<string, any> = {};
    for (const row of txRows as any[]) {
      if (!txMap[row.id]) {
        txMap[row.id] = {
          id: row.id,
          date: row.date,
          total_amount: row.total_amount,
          payment_method: row.payment_method,
          cashier_id: row.cashier_id,
          cashier_name: row.cashier_name,
          items: [] as any[]
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
    console.log('Sample grouped transaction:', transactions[0]);
    console.log('');
    
    // Calculate metrics
    const totalSales = transactions.reduce((s: number, t: any) => s + Number(t.total_amount || 0), 0);
    const totalTransactions = transactions.length;
    const avgSale = totalTransactions ? totalSales / totalTransactions : 0;
    
    console.log('💰 Total Sales:', totalSales);
    console.log('🧾 Total Transactions:', totalTransactions);
    console.log('📊 Average Sale:', avgSale);
    console.log('');
    
    // Daily sales
    const dailyMap: Record<string, number> = {};
    for (const tx of transactions as any[]) {
      const d = new Date(tx.date).toISOString().split('T')[0];
      dailyMap[d] = (dailyMap[d] || 0) + Number(tx.total_amount || 0);
    }
    
    console.log('📅 Daily sales:', dailyMap);
    console.log('');
    
    // Product performance
    const productPerfMap: Record<string, any> = {};
    for (const tx of transactions as any[]) {
      if (tx.items && tx.items.length) {
        for (const it of tx.items) {
          const pid = String(it.product_id);
          if (!productPerfMap[pid]) {
            productPerfMap[pid] = { 
              productId: it.product_id, 
              name: it.product_name, 
              quantity: 0, 
              totalSales: 0 
            };
          }
          productPerfMap[pid].quantity += Number(it.quantity || 0);
          productPerfMap[pid].totalSales += Number(it.quantity || 0) * Number(it.price || 0);
        }
      }
    }
    
    const productPerformance = Object.values(productPerfMap).sort((a: any, b: any) => b.quantity - a.quantity);
    console.log('🏆 Top 5 Products:');
    productPerformance.slice(0, 5).forEach((p: any, i: number) => {
      console.log(`   ${i + 1}. ${p.name}: ${p.quantity} units, Rs.${p.totalSales}`);
    });
    console.log('');
    
    // Category performance
    const categoryMap: Record<string, number> = {};
    for (const tx of transactions as any[]) {
      if (tx.items && tx.items.length) {
        for (const it of tx.items) {
          if (it.category) {
            categoryMap[it.category] = (categoryMap[it.category] || 0) + Number(it.quantity || 0) * Number(it.price || 0);
          }
        }
      }
    }
    
    console.log('📦 Category Performance:', categoryMap);
    console.log('');
    
    // Cashier performance
    const cashierMap: Record<string, number> = {};
    for (const tx of transactions as any[]) {
      if (tx.cashier_name) {
        cashierMap[tx.cashier_name] = (cashierMap[tx.cashier_name] || 0) + Number(tx.total_amount || 0);
      }
    }
    
    console.log('👤 Cashier Performance:', cashierMap);
    console.log('');
    
    console.log('✅ Analytics data is being retrieved correctly from the database!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await conn.end();
  }
}

testAnalyticsData();
