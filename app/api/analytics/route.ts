import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../lib/database';

function periodToDates(period: string) {
  const now = new Date();
  let start = new Date();

  switch (period) {
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start, end: now };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '30d';

    // Calculate days for the period
    let days = 30;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
    }

    const conn = await getConnection();

    // Transactions with items - Use DATE_SUB to avoid timezone issues
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

    // Daily sales aggregation
    const dailyMap: Record<string, number> = {};
    const productPerfMap: Record<string, any> = {};
    const categoryMap: Record<string, number> = {};
    const cashierMap: Record<string, number> = {};

    for (const tx of transactions as any[]) {
      const d = new Date(tx.date).toISOString().split('T')[0];
      dailyMap[d] = (dailyMap[d] || 0) + Number(tx.total_amount || 0);

      if (tx.items && tx.items.length) {
        for (const it of tx.items) {
          const pid = String(it.product_id || it.product_id === 0 ? it.product_id : 'unknown');
          if (!productPerfMap[pid]) productPerfMap[pid] = { productId: it.product_id, name: it.product_name, quantity: 0, totalSales: 0 };
          productPerfMap[pid].quantity += Number(it.quantity || 0);
          productPerfMap[pid].totalSales += Number(it.quantity || 0) * Number(it.price || 0);

          if (it.category) {
            categoryMap[it.category] = (categoryMap[it.category] || 0) + Number(it.quantity || 0) * Number(it.price || 0);
          }
        }
      }

      // cashier totals
      if (tx.cashier_name) {
        cashierMap[tx.cashier_name] = (cashierMap[tx.cashier_name] || 0) + Number(tx.total_amount || 0);
      }
    }

    const dailySales = Object.keys(dailyMap).sort().map(date => ({ date, total: dailyMap[date] }));

    const productPerformance = Object.values(productPerfMap).sort((a: any, b: any) => b.quantity - a.quantity);
    const topProducts = productPerformance.slice(0, 10);

    const categoryPerformance = Object.entries(categoryMap).map(([category, total]) => ({ category, total }));
    const cashierPerformance = Object.entries(cashierMap).map(([cashier, total]) => ({ cashier, total }));

    // Inventory health: compute current_stock from products + approved stock movements
    const [inventoryRows] = await conn.execute(
      `SELECT p.id, p.name, p.price, COALESCE(p.stock,0) as base_stock, p.category,
              COALESCE(SUM(CASE WHEN sm.status='approved' AND sm.movement_type='in' THEN sm.quantity ELSE 0 END),0) as stock_in,
              COALESCE(SUM(CASE WHEN sm.status='approved' AND sm.movement_type='out' THEN sm.quantity ELSE 0 END),0) as stock_out
       FROM products p
       LEFT JOIN stock_movements sm ON p.id = sm.product_id
       GROUP BY p.id, p.name, p.price, p.category`,
      []
    );

    const inventory = (inventoryRows as any[]).map(r => ({
      id: r.id,
      name: r.name,
      price: r.price,
      current_stock: Number(r.base_stock || 0) + Number(r.stock_in || 0) - Number(r.stock_out || 0),
      category: r.category
    }));

    const lowStock = inventory.filter(i => i.current_stock < 10);

    // KPIs
    const totalSales = transactions.reduce((s: number, t: any) => s + Number(t.total_amount || 0), 0);
    const totalTransactions = transactions.length;
    const avgSale = totalTransactions ? totalSales / totalTransactions : 0;

    // Calculate inventory health stats
    const totalProducts = inventory.length;
    const healthyStock = inventory.filter(i => i.current_stock > 10).length;
    const lowStockItems = inventory.filter(i => i.current_stock > 0 && i.current_stock <= 10).length;
    const outOfStock = inventory.filter(i => i.current_stock <= 0).length;
    const stockoutRate = totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0;
    const inventoryTurnover = totalProducts > 0 ? totalTransactions / totalProducts : 0;

    const kpis = {
      totalSales,
      totalTransactions,
      avgSale,
      lowStockCount: lowStock.length,
      stockoutRate,
      inventoryTurnover
    };

    await conn.end();

    // Calculate start and end dates for response
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      period,
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      salesMetrics: { 
        total_revenue: totalSales, 
        totalSales,
        total_transactions: totalTransactions,
        totalTransactions, 
        avg_transaction_value: avgSale,
        avgSale 
      },
      growthRate: 0,
      dailySales,
      peakHours: [],
      productPerformance,
      categoryPerformance,
      cashierPerformance,
      topProducts,
      inventoryHealth: { 
        items: inventory, 
        total_products: totalProducts,
        healthy_stock: healthyStock,
        low_stock: lowStockItems,
        out_of_stock: outOfStock,
        lowStockCount: lowStock.length 
      },
      customerInsights: {},
      kpis
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}

