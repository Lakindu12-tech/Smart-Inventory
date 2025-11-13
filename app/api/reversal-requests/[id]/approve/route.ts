import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'owner') {
      return NextResponse.json({ message: 'Only owner can approve reversals' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const owner_comment = body.owner_comment || body.comment || 'Approved';

    // Get the reversal request
    const requests = await query(
      'SELECT * FROM reversal_requests WHERE id = ? AND status = ?',
      [id, 'pending']
    ) as any[];

    if (!requests.length) {
      return NextResponse.json({ message: 'Reversal request not found or already processed' }, { status: 404 });
    }

    const request = requests[0];

    // Start transaction
    // 1. Mark the original transaction as reversed
    await query(
      'UPDATE transactions SET status = ? WHERE id = ?',
      ['reversed', request.transaction_id]
    );

    // 2. Restore stock for all items in the transaction
    const items = await query(
      'SELECT * FROM transaction_items WHERE transaction_id = ?',
      [request.transaction_id]
    ) as any[];

    for (const item of items) {
      await query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 3. Update the reversal request status
    await query(
      'UPDATE reversal_requests SET status = ?, owner_comment = ?, approved_by = ?, updated_at = NOW() WHERE id = ?',
      ['approved', owner_comment, decoded.userId, id]
    );

    return NextResponse.json({ 
      message: 'Bill reversal approved successfully. Transaction reversed and stock restored.' 
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to approve reversal' }, { status: 500 });
  }
}
