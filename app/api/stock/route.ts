import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

// GET: Get stock levels and movements (all roles)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const includeMovements = searchParams.get('movements') === 'true';

    // Get products with current stock levels
    const products = await query(`
      SELECT p.*, 
             COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as current_stock
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `) as any[];

    let movements = [];
    if (includeMovements) {
      // Get recent stock movements
      movements = await query(`
        SELECT sm.*, p.name as product_name, u.name as performed_by_name, a.name as approved_by_name
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        JOIN users u ON sm.performed_by = u.id
        LEFT JOIN users a ON sm.approved_by = a.id
        ORDER BY sm.created_at DESC
        LIMIT 50
      `) as any[];
    }

    return NextResponse.json({ products, movements });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch stock data' }, { status: 500 });
  }
}

// POST: Submit stock movement request (Storekeeper only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'storekeeper') {
      return NextResponse.json({ message: 'Only storekeepers can submit stock movements' }, { status: 403 });
    }

    const { product_id, movement_type, quantity, reason } = await req.json();

    if (!product_id || !movement_type || !quantity) {
      return NextResponse.json({ message: 'Product ID, movement type, and quantity are required' }, { status: 400 });
    }

    if (!['in', 'out', 'adjustment'].includes(movement_type)) {
      return NextResponse.json({ message: 'Invalid movement type' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ message: 'Quantity must be positive' }, { status: 400 });
    }

    // Check if product exists
    const products = await query('SELECT id FROM products WHERE id = ?', [product_id]) as any[];
    if (products.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Insert stock movement
    const result = await query(`
      INSERT INTO stock_movements (product_id, movement_type, quantity, reason, performed_by, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [product_id, movement_type, quantity, reason || null, decoded.userId]) as any;

    return NextResponse.json({ 
      message: 'Stock movement request submitted',
      movementId: result.insertId
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to submit stock movement' }, { status: 500 });
  }
} 