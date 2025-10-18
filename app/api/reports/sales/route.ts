import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/database';

// GET /api/reports/sales
export async function GET(req: NextRequest) {
  const url = new URL(req.url!);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const productId = url.searchParams.get('productId');
  const userId = url.searchParams.get('userId');
  const groupBy = url.searchParams.get('groupBy') || 'day';

  let whereClauses = [];
  let params: any[] = [];

  if (startDate) {
    whereClauses.push('t.date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push('t.date <= ?');
    params.push(endDate);
  }
  if (userId) {
    whereClauses.push('t.cashier_id = ?');
    params.push(userId);
  }
  if (productId) {
    whereClauses.push('ti.product_id = ?');
    params.push(productId);
  }

  const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

  // Grouping for sales by period
  let groupExpr = 'DATE(t.date)';
  if (groupBy === 'week') groupExpr = 'YEARWEEK(t.date)';
  if (groupBy === 'month') groupExpr = 'DATE_FORMAT(t.date, "%Y-%m")';

  const connection = await getConnection();

  try {
    // Summary: total transactions, total sales
    const [summaryRows] = await connection.execute(
      `SELECT COUNT(DISTINCT t.id) as totalTransactions, COALESCE(SUM(t.total_amount),0) as totalSales
       FROM transactions t
       LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
       ${where}`,
      params
    );
    const summary = Array.isArray(summaryRows) ? summaryRows[0] : summaryRows;

    // Sales by period
    const [periodRows] = await connection.execute(
      `SELECT ${groupExpr} as period, COALESCE(SUM(t.total_amount),0) as total, COUNT(DISTINCT t.id) as transactions
       FROM transactions t
       LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
       ${where}
       GROUP BY period
       ORDER BY period ASC`,
      params
    );

    // Top-selling products
    const [topRows] = await connection.execute(
      `SELECT p.id as productId, p.name, SUM(ti.quantity) as quantity, SUM(ti.unit_price * ti.quantity) as totalSales
       FROM transaction_items ti
       JOIN products p ON ti.product_id = p.id
       JOIN transactions t ON ti.transaction_id = t.id
       ${where}
       GROUP BY p.id, p.name
       ORDER BY quantity DESC
       LIMIT 5`,
      params
    );

    // Transaction details
    const [txRows] = await connection.execute(
      `SELECT t.id, t.date, t.total_amount, u.name as cashier,
              ti.product_id, p.name as product_name, ti.quantity, ti.unit_price as price
       FROM transactions t
       LEFT JOIN users u ON t.cashier_id = u.id
       LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
       LEFT JOIN products p ON ti.product_id = p.id
       ${where}
       ORDER BY t.date DESC, t.id DESC`,
      params
    );

    // Group items by transaction
    const txMap: any = {};
    for (const row of txRows as any[]) {
      if (!txMap[row.id]) {
        txMap[row.id] = {
          id: row.id,
          date: row.date,
          cashier: row.cashier,
          total_amount: row.total_amount,
          items: []
        };
      }
      if (row.product_id) {
        txMap[row.id].items.push({
          productId: row.product_id,
          name: row.product_name,
          quantity: row.quantity,
          price: row.price
        });
      }
    }

    return NextResponse.json({
      summary: {
        totalTransactions: summary.totalTransactions,
        totalSales: summary.totalSales,
        salesByPeriod: periodRows,
        topProducts: topRows
      },
      transactions: Object.values(txMap)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report', details: error }, { status: 500 });
  } finally {
    await connection.end();
  }
} 