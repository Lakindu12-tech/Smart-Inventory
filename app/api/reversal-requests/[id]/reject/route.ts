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
      return NextResponse.json({ message: 'Only owner can reject reversals' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const owner_comment = body.owner_comment || body.comment;

    if (!owner_comment || !owner_comment.trim()) {
      return NextResponse.json({ message: 'Comment is required for rejection' }, { status: 400 });
    }

    // Update only if pending - single optimized query
    const result = await query(
      'UPDATE reversal_requests SET status = ?, owner_comment = ?, approved_by = ?, updated_at = NOW() WHERE id = ? AND status = ?',
      ['rejected', owner_comment.trim(), decoded.userId, id, 'pending']
    ) as any;

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Reversal request not found or already processed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bill reversal request rejected' });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to reject reversal' }, { status: 500 });
  }
}
