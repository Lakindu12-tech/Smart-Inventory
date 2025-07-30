import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || !['owner', 'storekeeper', 'cashier'].includes(decoded.role)) {
      return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'today';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Fetch sales data
    const transactions = await query(`
      SELECT t.*, ti.product_id, ti.quantity, ti.price, p.name as product_name
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE t.date >= ?
      ORDER BY t.date DESC
    `, [startDate.toISOString()]) as any[];

    // Group transactions with their items
    const groupedTransactions = transactions.reduce((acc: any, row) => {
      if (!acc[row.id]) {
        acc[row.id] = {
          id: row.id,
          total_amount: row.total_amount,
          payment_method: row.payment_method,
          date: row.date,
          cashier_id: row.cashier_id,
          items: []
        };
      }
      if (row.product_id) {
        acc[row.id].items.push({
          product_id: row.product_id,
          product_name: row.product_name,
          quantity: row.quantity,
          price: row.price
        });
      }
      return acc;
    }, {});

    // Fetch inventory data
    const inventory = await query(`
      SELECT id, name, price, current_stock, category
      FROM products
      ORDER BY name
    `) as any[];

    // Fetch user data
    const users = await query(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE is_active = TRUE AND role != 'owner'
      ORDER BY name
    `) as any[];

    return NextResponse.json({
      sales: Object.values(groupedTransactions),
      inventory,
      transactions: Object.values(groupedTransactions),
      users
    });

  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to fetch reports' }, { status: 500 });
  }
} 