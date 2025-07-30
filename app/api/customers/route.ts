import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

// GET - Fetch customers
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    // Check if user has access to customer data
    if (decoded.role !== 'cashier' && decoded.role !== 'owner') {
      return NextResponse.json({ message: 'Access denied. Cashier or Owner only.' }, { status: 403 });
    }

    const customers = await query(`
      SELECT id, name, phone, email, address, created_at
      FROM customers 
      ORDER BY name
    `) as any[];

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

// POST - Create a new customer
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    // Only cashiers can create customers
    if (decoded.role !== 'cashier') {
      return NextResponse.json({ message: 'Only cashiers can create customers' }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, email, address } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Customer name is required' }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO customers (name, phone, email, address)
      VALUES (?, ?, ?, ?)
    `, [name.trim(), phone || null, email || null, address || null]) as any;

    return NextResponse.json({
      message: 'Customer created successfully',
      customerId: result.insertId
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create customer' }, { status: 500 });
  }
} 