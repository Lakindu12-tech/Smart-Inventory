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
    const { owner_comment } = await req.json();
    // Get the request
    const requests = await query('SELECT * FROM product_requests WHERE id = ?', [id]) as any[];
    if (!requests.length) return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    const request = requests[0];
    if (request.status !== 'pending') return NextResponse.json({ message: 'Request already processed' }, { status: 400 });
    // Mark request as rejected
    await query('UPDATE product_requests SET status = ?, owner_comment = ?, updated_at = NOW() WHERE id = ?', ['rejected', owner_comment || null, id]);
    return NextResponse.json({ message: 'Request rejected' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to reject request' }, { status: 500 });
  }
} 