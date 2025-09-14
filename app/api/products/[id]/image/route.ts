import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

// PATCH: Update product image filename
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'cashier' && decoded.role !== 'owner')) {
      return NextResponse.json({ message: 'Only cashiers and owners can update product images' }, { status: 403 });
    }

    const { id } = params;
    const { image_filename } = await req.json();

    if (!image_filename) {
      return NextResponse.json({ message: 'Image filename is required' }, { status: 400 });
    }

    // Check if product exists
    const products = await query('SELECT id FROM products WHERE id = ?', [id]) as any[];
    if (!products.length) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Update product image filename
    await query('UPDATE products SET image_filename = ? WHERE id = ?', [image_filename, id]);

    return NextResponse.json({ message: 'Product image updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to update product image' }, { status: 500 });
  }
}

