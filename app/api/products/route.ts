import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';

// GET: List all products (all roles)
export async function GET() {
  try {
    const products = await query('SELECT * FROM products ORDER BY name ASC') as any[];
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch products' }, { status: 500 });
  }
} 