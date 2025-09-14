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
      return NextResponse.json({ message: 'Only owner can approve stock movements' }, { status: 403 });
    }

    const { id } = params;
    // Optional comment on approve; ignore if absent
    let owner_comment: string | null = null;
    try {
      const body = await req.json();
      const incoming = (body?.owner_comment ?? body?.comment ?? '').toString().trim();
      owner_comment = incoming || null;
    } catch {
      owner_comment = null;
    }

    // Get the stock movement
    const movements = await query('SELECT * FROM stock_movements WHERE id = ?', [id]) as any[];
    if (!movements.length) return NextResponse.json({ message: 'Stock movement not found' }, { status: 404 });
    
    const movement = movements[0];
    if (movement.status !== 'pending') {
      return NextResponse.json({ message: 'Stock movement already processed' }, { status: 400 });
    }

    // Update stock movement status; append approve note to reason if provided
    let reasonToStore = movement.reason || null;
    if (owner_comment) {
      const existing = movement.reason ? `${movement.reason}\n` : '';
      reasonToStore = `${existing}Approved by owner: ${owner_comment}`.slice(0, 255);
    }
    await query('UPDATE stock_movements SET status = ?, approved_by = ?, reason = ?, updated_at = NOW() WHERE id = ?', 
      ['approved', decoded.userId, reasonToStore, id]);

    return NextResponse.json({ message: 'Stock movement approved' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to approve stock movement' }, { status: 500 });
  }
} 