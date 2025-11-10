import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../../lib/database';
import { verifyToken } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = decoded.role;
    const userId = decoded.userId;

    const conn = await getConnection();

    // Get today's date range
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // ============================================
    // OWNER REPORTS
    // ============================================
    if (userRole === 'owner') {
      // 1. Today's Transactions (Bills) with Product Details
      const [todayBills] = await conn.execute(
        `SELECT t.id, t.transaction_number, t.total_amount, t.payment_method, t.date, 
                u.name as cashier_name
         FROM transactions t
         LEFT JOIN users u ON t.cashier_id = u.id
         WHERE DATE(t.date) = CURDATE()
         ORDER BY t.date DESC`
      );

      // Get items for each bill
      const billsWithItems = await Promise.all((todayBills as any[]).map(async (bill) => {
        const [items] = await conn.execute(
          `SELECT ti.id, ti.quantity, ti.unit_price, ti.total_price as subtotal,
                  p.name as product_name, p.category
           FROM transaction_items ti
           JOIN products p ON ti.product_id = p.id
           WHERE ti.transaction_id = ?`,
          [bill.id]
        );
        return {
          ...bill,
          items: items,
          items_count: (items as any[]).length
        };
      }));

      // 2. Today's Stock Movements
      const [todayStockMovements] = await conn.execute(
        `SELECT sm.id, sm.movement_type, sm.quantity, sm.reason, sm.status, sm.created_at,
                p.name as product_name, u.name as performed_by
         FROM stock_movements sm
         JOIN products p ON sm.product_id = p.id
         JOIN users u ON sm.performed_by = u.id
         WHERE DATE(sm.created_at) = CURDATE()
         ORDER BY sm.created_at DESC`
      );

      // 3. Transaction History Summary (Last 30 days)
      const [historySummary] = await conn.execute(
        `SELECT DATE(t.date) as date, 
                COUNT(t.id) as transaction_count,
                SUM(t.total_amount) as total_revenue
         FROM transactions t
         WHERE t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY DATE(t.date)
         ORDER BY date ASC`
      );

      // 4. Total statistics
      const [totalStats] = await conn.execute(
        `SELECT 
           COUNT(*) as total_transactions,
           SUM(total_amount) as total_revenue,
           AVG(total_amount) as avg_transaction
         FROM transactions
         WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
      );

      // 5. Inventory Value (Current stock * price for each product)
      const [inventoryValue] = await conn.execute(
        `SELECT p.id, p.name, p.category, p.price,
                COALESCE(p.stock, 0) + 
                COALESCE(SUM(CASE WHEN sm.status='approved' AND sm.movement_type='in' THEN sm.quantity ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN sm.status='approved' AND sm.movement_type='out' THEN sm.quantity ELSE 0 END), 0) as current_stock
         FROM products p
         LEFT JOIN stock_movements sm ON p.id = sm.product_id
         GROUP BY p.id, p.name, p.category, p.price`
      );

      const inventoryWithValue = (inventoryValue as any[]).map(item => ({
        ...item,
        stock_value: Number(item.current_stock) * Number(item.price),
        current_stock: Number(item.current_stock)
      }));

      const totalInventoryValue = inventoryWithValue.reduce((sum, item) => sum + item.stock_value, 0);

      // 6. Top Selling Products (Last 30 days by quantity)
      const [topSellingProducts] = await conn.execute(
        `SELECT p.id, p.name, p.category,
                SUM(ti.quantity) as total_sold,
                SUM(ti.quantity * ti.unit_price) as total_revenue
         FROM transaction_items ti
         JOIN products p ON ti.product_id = p.id
         JOIN transactions t ON ti.transaction_id = t.id
         WHERE t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY p.id, p.name, p.category
         ORDER BY total_sold DESC
         LIMIT 10`
      );

      // 7. Products Not Sold (Last 7 days)
      const [unsoldProducts] = await conn.execute(
        `SELECT p.id, p.name, p.category, p.price,
                COALESCE(MAX(t.date), 'Never') as last_sold
         FROM products p
         LEFT JOIN transaction_items ti ON p.id = ti.product_id
         LEFT JOIN transactions t ON ti.transaction_id = t.id
         WHERE p.id NOT IN (
           SELECT DISTINCT ti2.product_id 
           FROM transaction_items ti2
           JOIN transactions t2 ON ti2.transaction_id = t2.id
           WHERE t2.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         )
         GROUP BY p.id, p.name, p.category, p.price
         LIMIT 10`
      );

      // 8. Highest Revenue Products (Last 30 days)
      const [highestRevenueProducts] = await conn.execute(
        `SELECT p.id, p.name, p.category,
                SUM(ti.quantity) as total_sold,
                SUM(ti.quantity * ti.unit_price) as total_revenue
         FROM transaction_items ti
         JOIN products p ON ti.product_id = p.id
         JOIN transactions t ON ti.transaction_id = t.id
         WHERE t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY p.id, p.name, p.category
         ORDER BY total_revenue DESC
         LIMIT 10`
      );

      await conn.end();

      return NextResponse.json({
        role: 'owner',
        todayTransactions: {
          bills: billsWithItems,
          stockMovements: todayStockMovements,
          billsCount: billsWithItems.length,
          stockMovementsCount: (todayStockMovements as any[]).length
        },
        historySummary: {
          daily: historySummary,
          totals: (totalStats as any[])[0]
        },
        inventory: {
          products: inventoryWithValue,
          totalValue: totalInventoryValue
        },
        productPerformance: {
          topSelling: topSellingProducts,
          unsoldProducts: unsoldProducts,
          highestRevenue: highestRevenueProducts
        }
      });
    }

    // ============================================
    // STOREKEEPER REPORTS
    // ============================================
    if (userRole === 'storekeeper') {
      // 1. Inventory Value
      const [inventoryValue] = await conn.execute(
        `SELECT p.id, p.name, p.category, p.price,
                COALESCE(p.stock, 0) + 
                COALESCE(SUM(CASE WHEN sm.status='approved' AND sm.movement_type='in' THEN sm.quantity ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN sm.status='approved' AND sm.movement_type='out' THEN sm.quantity ELSE 0 END), 0) as current_stock
         FROM products p
         LEFT JOIN stock_movements sm ON p.id = sm.product_id
         GROUP BY p.id, p.name, p.category, p.price`
      );

      const inventoryWithValue = (inventoryValue as any[]).map(item => ({
        ...item,
        stock_value: Number(item.current_stock) * Number(item.price),
        current_stock: Number(item.current_stock),
        stock_status: Number(item.current_stock) <= 0 ? 'Out of Stock' : 
                     Number(item.current_stock) <= 10 ? 'Low Stock' : 'In Stock'
      }));

      const totalInventoryValue = inventoryWithValue.reduce((sum, item) => sum + item.stock_value, 0);

      // 2. Stock Status Counts
      const outOfStock = inventoryWithValue.filter(item => item.current_stock <= 0);
      const lowStock = inventoryWithValue.filter(item => item.current_stock > 0 && item.current_stock <= 10);
      const inStock = inventoryWithValue.filter(item => item.current_stock > 10);

      // 3. Top Selling Products (Last 30 days)
      const [topSellingProducts] = await conn.execute(
        `SELECT p.id, p.name, p.category,
                SUM(ti.quantity) as total_sold,
                SUM(ti.quantity * ti.unit_price) as total_revenue
         FROM transaction_items ti
         JOIN products p ON ti.product_id = p.id
         JOIN transactions t ON ti.transaction_id = t.id
         WHERE t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY p.id, p.name, p.category
         ORDER BY total_sold DESC
         LIMIT 10`
      );

      // 4. Products Not Sold (Last 7 days)
      const [unsoldProducts] = await conn.execute(
        `SELECT p.id, p.name, p.category, p.price,
                COALESCE(MAX(t.date), 'Never') as last_sold
         FROM products p
         LEFT JOIN transaction_items ti ON p.id = ti.product_id
         LEFT JOIN transactions t ON ti.transaction_id = t.id
         WHERE p.id NOT IN (
           SELECT DISTINCT ti2.product_id 
           FROM transaction_items ti2
           JOIN transactions t2 ON ti2.transaction_id = t2.id
           WHERE t2.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         )
         GROUP BY p.id, p.name, p.category, p.price
         LIMIT 10`
      );

      await conn.end();

      return NextResponse.json({
        role: 'storekeeper',
        inventory: {
          products: inventoryWithValue,
          totalValue: totalInventoryValue,
          stockStatus: {
            outOfStock: outOfStock.length,
            lowStock: lowStock.length,
            inStock: inStock.length
          }
        },
        stockCategories: {
          outOfStock: outOfStock,
          lowStock: lowStock
        },
        productPerformance: {
          topSelling: topSellingProducts,
          unsoldProducts: unsoldProducts
        }
      });
    }

    // ============================================
    // CASHIER REPORTS
    // ============================================
    if (userRole === 'cashier') {
      // 1. Today's Bills (by this cashier) with Product Details
      const [todayBills] = await conn.execute(
        `SELECT t.id, t.transaction_number, t.total_amount, t.payment_method, t.date
         FROM transactions t
         WHERE DATE(t.date) = CURDATE() AND t.cashier_id = ?
         ORDER BY t.date DESC`,
        [userId]
      );

      // Get items for each bill
      const billsWithItems = await Promise.all((todayBills as any[]).map(async (bill) => {
        const [items] = await conn.execute(
          `SELECT ti.id, ti.quantity, ti.unit_price, ti.total_price as subtotal,
                  p.name as product_name, p.category
           FROM transaction_items ti
           JOIN products p ON ti.product_id = p.id
           WHERE ti.transaction_id = ?`,
          [bill.id]
        );
        return {
          ...bill,
          items: items,
          items_count: (items as any[]).length
        };
      }));

      const todayTotal = billsWithItems.reduce((sum, bill) => sum + Number(bill.total_amount), 0);

      // 2. Bill History Summary (Last 30 days)
      const [historySummary] = await conn.execute(
        `SELECT DATE(t.date) as date, 
                COUNT(t.id) as bill_count,
                SUM(t.total_amount) as total_revenue
         FROM transactions t
         WHERE t.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND t.cashier_id = ?
         GROUP BY DATE(t.date)
         ORDER BY date ASC`,
        [userId]
      );

      // 3. Total statistics
      const [totalStats] = await conn.execute(
        `SELECT 
           COUNT(*) as total_bills,
           SUM(total_amount) as total_revenue,
           AVG(total_amount) as avg_bill
         FROM transactions
         WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND cashier_id = ?`,
        [userId]
      );

      await conn.end();

      return NextResponse.json({
        role: 'cashier',
        todayBills: {
          bills: billsWithItems,
          count: billsWithItems.length,
          total: todayTotal
        },
        historySummary: {
          daily: historySummary,
          totals: (totalStats as any[])[0]
        }
      });
    }

    await conn.end();
    return NextResponse.json({ message: 'Invalid role' }, { status: 403 });

  } catch (error: any) {
    console.error('Reports Analytics API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to fetch reports' }, { status: 500 });
  }
}
