import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

export async function PATCH(req: NextRequest, { params }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'owner') {
      return NextResponse.json({ message: 'Only owner can reject stock movements' }, { status: 403 });
    }

    const { id } = params;
    // Don't require request body for rejection

    // Get the stock movement
    const movements = await query('SELECT * FROM stock_movements WHERE id = ?', [id]) as any[];
    if (!movements.length) return NextResponse.json({ message: 'Stock movement not found' }, { status: 404 });
    
    const movement = movements[0];
    if (movement.status !== 'pending') {
      return NextResponse.json({ message: 'Stock movement already processed' }, { status: 400 });
    }

    // Update stock movement status
    await query('UPDATE stock_movements SET status = ?, approved_by = ?, created_at = NOW() WHERE id = ?', 
      ['rejected', decoded.userId, id]);

    return NextResponse.json({ message: 'Stock movement rejected' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to reject stock movement' }, { status: 500 });
  }
} 