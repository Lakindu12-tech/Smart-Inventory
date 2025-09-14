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
      return NextResponse.json({ message: 'Only owner can approve requests' }, { status: 403 });
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
    // Get the request
    const requests = await query('SELECT * FROM product_requests WHERE id = ?', [id]) as any[];
    if (!requests.length) return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    const request = requests[0];
    if (request.status !== 'pending') return NextResponse.json({ message: 'Request already processed' }, { status: 400 });
    // Process by type
    if (request.type === 'add') {
      // Insert new product with name and category, price=0
      await query('INSERT INTO products (name, price, stock, category) VALUES (?, 0, 0, ?)', [request.product_name, request.category]);
    } else if (request.type === 'price') {
      // Update product price
      await query('UPDATE products SET price = ? WHERE id = ?', [request.requested_price, request.product_id]);
    } else if (request.type === 'stock') {
      // Update product stock
      await query('UPDATE products SET stock = stock + ? WHERE id = ?', [request.requested_quantity, request.product_id]);
    }
    // Mark request as approved
    await query('UPDATE product_requests SET status = ?, owner_comment = ?, updated_at = NOW() WHERE id = ?', ['approved', owner_comment, id]);
    return NextResponse.json({ message: 'Request approved and processed' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to approve request' }, { status: 500 });
  }
} 