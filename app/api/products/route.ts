import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';

// GET: List all products (all roles)
export async function GET() {
  try {
    // Get products with properly calculated current stock
    const products = await query(`
      SELECT 
        p.*,
        COALESCE(p.stock, 0) + 
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as current_stock
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.name, p.price, p.stock, p.category, p.image_filename, p.created_at
      ORDER BY p.name ASC
    `) as any[];
    
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch products' }, { status: 500 });
  }
} 