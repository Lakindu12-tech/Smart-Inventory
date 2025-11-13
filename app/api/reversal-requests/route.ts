import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

// GET - Fetch reversal requests
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    let sql = `
      SELECT 
        rr.*,
        u.name as cashier_name,
        owner.name as approved_by_name
      FROM reversal_requests rr
      JOIN users u ON rr.cashier_id = u.id
      LEFT JOIN users owner ON rr.approved_by = owner.id
    `;
    
    const params: any[] = [];
    
    // Cashiers see only their own requests
    if (decoded.role === 'cashier') {
      sql += ' WHERE rr.cashier_id = ?';
      params.push(decoded.userId);
    }
    // Owners see all requests (no WHERE clause needed)
    
    sql += ' ORDER BY rr.created_at DESC';
    
    const requests = await query(sql, params) as any[];
    return NextResponse.json(requests);
    
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch reversal requests' }, { status: 500 });
  }
}

// POST - Create new reversal request (cashier only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    // Only cashiers can request bill reversals
    if (decoded.role !== 'cashier') {
      return NextResponse.json({ message: 'Only cashiers can request bill reversals' }, { status: 403 });
    }

    const body = await req.json();
    const { transaction_id, reason } = body;

    if (!transaction_id || !reason || !reason.trim()) {
      return NextResponse.json({ message: 'Transaction ID and reason are required' }, { status: 400 });
    }

    // Fetch the transaction to verify it belongs to this cashier
    const transactions = await query(
      'SELECT * FROM transactions WHERE id = ? AND cashier_id = ? AND status = ?',
      [transaction_id, decoded.userId, 'active']
    ) as any[];

    if (!transactions.length) {
      return NextResponse.json({ 
        message: 'Transaction not found, does not belong to you, or already reversed' 
      }, { status: 404 });
    }

    const transaction = transactions[0];

    // Check if transaction is within 2 days (48 hours)
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    const hoursDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 48) {
      return NextResponse.json({ 
        message: 'Cannot reverse bills older than 2 days. This transaction is too old.' 
      }, { status: 400 });
    }

    // Check if there's already a pending request for this transaction
    const existing = await query(
      'SELECT * FROM reversal_requests WHERE transaction_id = ? AND status = ?',
      [transaction_id, 'pending']
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json({ 
        message: 'A reversal request for this transaction is already pending' 
      }, { status: 400 });
    }

    // Create the reversal request
    await query(`
      INSERT INTO reversal_requests 
      (transaction_id, transaction_number, total_amount, cashier_id, cashier_reason, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [
      transaction_id,
      transaction.transaction_number || `TXN-${transaction.id}`,
      transaction.total_amount,
      decoded.userId,
      reason.trim()
    ]);

    return NextResponse.json({ 
      message: 'Reversal request submitted successfully. Waiting for owner approval.' 
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create reversal request' }, { status: 500 });
  }
}
