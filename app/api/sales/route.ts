import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

// GET - Fetch sales data (transactions, products)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    // Check if user has access to sales data
    if (decoded.role !== 'cashier' && decoded.role !== 'owner') {
      return NextResponse.json({ message: 'Access denied. Cashier or Owner only.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const includeTransactions = searchParams.get('transactions') === 'true';

    let data: any = {};

    // Fetch products with calculated stock levels
    const products = await query(`
      SELECT p.*, 
             COALESCE(p.stock, 0) +
             COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as current_stock
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.name, p.price, p.stock, p.category, p.image_filename, p.created_at
      HAVING current_stock > 0
      ORDER BY p.name
    `) as any[];
    data.products = products;

    // Fetch recent transactions if requested
    if (includeTransactions) {
      const transactions = await query(`
        SELECT 
          t.id,
          t.transaction_number,
          t.total_amount,
          t.payment_method,
          t.payment_status,
          t.status,
          t.discount,
          t.created_at,
          u.name as cashier_name
        FROM transactions t
        LEFT JOIN users u ON t.cashier_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 50
      `) as any[];
      data.transactions = transactions;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch sales data' }, { status: 500 });
  }
}

// POST - Create a new transaction
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    // Only cashiers can create transactions
    if (decoded.role !== 'cashier') {
      return NextResponse.json({ message: 'Only cashiers can create transactions' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      items, 
      payment_method = 'cash',
      discount = 0,
      notes = ''
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Transaction items are required' }, { status: 400 });
    }

    // Generate transaction number if not provided
    const transaction_number = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Validate items and calculate total
    let calculatedTotal = 0;
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return NextResponse.json({ message: 'Invalid item data' }, { status: 400 });
      }

      // Get product details with current stock
      const products = await query(`
        SELECT p.*, 
               COALESCE(p.stock, 0) + 
               COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
               COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as current_stock
        FROM products p
        LEFT JOIN stock_movements sm ON p.id = sm.product_id
        WHERE p.id = ?
        GROUP BY p.id, p.name, p.price, p.stock, p.category, p.image_filename, p.created_at
      `, [item.product_id]) as any[];
      
      if (!products.length) {
        return NextResponse.json({ message: `Product with ID ${item.product_id} not found` }, { status: 404 });
      }

      const product = products[0];
      if (product.current_stock < item.quantity) {
        return NextResponse.json({ message: `Insufficient stock for product ID ${item.product_id}` }, { status: 400 });
      }

      calculatedTotal += product.price * item.quantity;
    }

    // Apply discount
    const finalTotal = Math.max(0, calculatedTotal - (discount || 0));

    // Create transaction
    const transactionResult = await query(`
      INSERT INTO transactions (transaction_number, cashier_id, total_amount, payment_method, discount, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [transaction_number, decoded.userId, finalTotal, payment_method, discount, notes]) as any;

    const transactionId = transactionResult.insertId;

    // Create transaction items and create stock-out movements
    for (const item of items) {
      const products = await query('SELECT price FROM products WHERE id = ?', [item.product_id]) as any[];
      const product = products[0];
      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;

      // Insert transaction item
      await query(`
        INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `, [transactionId, item.product_id, item.quantity, unitPrice, totalPrice]);

      // Create stock-out movement (automatically approved for sales)
      await query(`
        INSERT INTO stock_movements (product_id, movement_type, quantity, reason, performed_by, status, approved_by)
        VALUES (?, 'out', ?, 'Sale transaction', ?, 'approved', ?)
      `, [item.product_id, item.quantity, decoded.userId, decoded.userId]);
    }

    return NextResponse.json({
      message: 'Transaction created successfully',
      transaction_id: transactionId,
      transaction_number: transaction_number,
      totalAmount: finalTotal
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create transaction' }, { status: 500 });
  }
} 