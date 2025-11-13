import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

// POST: Submit a new product/stock/price request (Storekeeper only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'storekeeper') {
      return NextResponse.json({ message: 'Only storekeepers can submit requests' }, { status: 403 });
    }
    const { type, product_id, product_name, requested_price, requested_quantity, reason, category } = await req.json();
    if (!type || !['add','price','stock'].includes(type)) {
      return NextResponse.json({ message: 'Invalid or missing request type' }, { status: 400 });
    }
    // For 'add', product_name is required. For 'price' or 'stock', product_id is required.
    if (type === 'add' && !product_name) {
      return NextResponse.json({ message: 'Product name required for add requests' }, { status: 400 });
    }
    if ((type === 'price' || type === 'stock') && !product_id) {
      return NextResponse.json({ message: 'Product ID required for price/stock requests' }, { status: 400 });
    }
    const result = await query(
      `INSERT INTO product_requests (requester_id, type, product_id, product_name, requested_price, requested_quantity, reason, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [decoded.userId, type, product_id || null, product_name || null, requested_price || null, requested_quantity || null, reason || null, type === 'add' ? category || 'Other' : null]
    ) as any;
    return NextResponse.json({ message: 'Request submitted', requestId: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to submit request' }, { status: 500 });
  }
}

// GET: List product requests (Owner sees all, Storekeeper sees their own)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    let sql = 'SELECT pr.*, u.name as requester_name, p.name as product_name FROM product_requests pr JOIN users u ON pr.requester_id = u.id LEFT JOIN products p ON pr.product_id = p.id';
    const params: any[] = [];
    const filters: string[] = [];
    if (decoded.role === 'storekeeper') {
      filters.push('pr.requester_id = ?');
      params.push(decoded.userId);
    }
    const status = (searchParams.get('status') || '').toLowerCase();
    if (['pending','approved','rejected'].includes(status)) {
      filters.push('pr.status = ?');
      params.push(status);
    }
    const type = (searchParams.get('type') || '').toLowerCase();
    if (['add','price','stock'].includes(type)) {
      filters.push('pr.type = ?');
      params.push(type);
    }
    if (filters.length > 0) {
      sql += ' WHERE ' + filters.join(' AND ');
    }
    sql += ' ORDER BY COALESCE(pr.updated_at, pr.created_at) DESC';
    const requests = await query(sql, params) as any[];
    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch requests' }, { status: 500 });
  }
} 