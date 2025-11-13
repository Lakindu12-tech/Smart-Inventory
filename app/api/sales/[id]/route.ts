import { NextRequest, NextResponse } from 'next/server';
import type { NextApiRequest } from 'next';
import { query } from '../../../../lib/database';
import { verifyToken } from '../../../../lib/auth';

// GET - Fetch transaction details
interface Context { params: { id: string } }
export async function GET(req: NextRequest, context: Context) {
  const { params } = context;
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    // Check if user has access to sales data
    if (decoded.role !== 'cashier' && decoded.role !== 'owner') {
      return NextResponse.json({ message: 'Access denied. Cashier or Owner only.' }, { status: 403 });
    }

    const { id } = params;

    // Fetch transaction details
    const transactions = await query(`
      SELECT 
        t.id,
        t.transaction_number,
        t.total_amount,
        t.payment_method,
        t.payment_status,
        t.status,
        t.notes,
        t.date,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.address as customer_address,
        u.name as cashier_name
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.cashier_id = u.id
      WHERE t.id = ?
    `, [id]) as any[];

    if (!transactions.length) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    const transaction = transactions[0];

    // Fetch transaction items
    const items = await query(`
      SELECT 
        ti.id,
        ti.quantity,
        ti.unit_price,
        ti.total_price,
        p.name as product_name,
        p.category as product_category
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE ti.transaction_id = ?
      ORDER BY ti.id
    `, [id]) as any[];

    return NextResponse.json({
      transaction,
      items
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch transaction details' }, { status: 500 });
  }
} 