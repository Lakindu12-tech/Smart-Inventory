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
      return NextResponse.json({ message: 'Only owner can reject requests' }, { status: 403 });
    }
    const { id } = params;
    let owner_comment: string | null = null;
    try {
      const body = await req.json();
      const incoming = (body?.owner_comment ?? body?.comment ?? '').toString().trim();
      owner_comment = incoming || null;
    } catch {
      owner_comment = null;
    }
    if (!owner_comment) {
      return NextResponse.json({ message: 'Rejection requires a comment' }, { status: 400 });
    }
    // Update only if pending - single optimized query
    const result = await query(
      'UPDATE product_requests SET status = ?, owner_comment = ?, updated_at = NOW() WHERE id = ? AND status = ?', 
      ['rejected', owner_comment, id, 'pending']
    ) as any;
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Request not found or already processed' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Request rejected' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to reject request' }, { status: 500 });
  }
} 