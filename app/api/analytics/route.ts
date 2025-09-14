import { NextRequest, NextResponse } from 'next/server';
import { query } from 'lib/database';
import { verifyToken } from 'lib/auth';

// GET: Advanced Analytics Data
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || !['owner', 'storekeeper'].includes(decoded.role)) {
      return NextResponse.json({ message: 'Access denied. Owner or Storekeeper only.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 1. Sales Performance Metrics
    const salesMetrics = await query(`
      SELECT 
        COUNT(DISTINCT t.id) as total_transactions,
        COALESCE(SUM(t.total_amount), 0) as total_revenue,
        COALESCE(AVG(t.total_amount), 0) as avg_transaction_value,
        COALESCE(MAX(t.total_amount), 0) as max_transaction_value,
        COALESCE(MIN(t.total_amount), 0) as min_transaction_value
      FROM transactions t
      WHERE t.date >= ?
    `, [startDate.toISOString()]) as any[];

    // 2. Daily Sales Trend
    const dailySales = await query(`
      SELECT 
        DATE(t.date) as date,
        COUNT(DISTINCT t.id) as transactions,
        COALESCE(SUM(t.total_amount), 0) as revenue,
        COALESCE(AVG(t.total_amount), 0) as avg_value
      FROM transactions t
      WHERE t.date >= ?
      GROUP BY DATE(t.date)
      ORDER BY date ASC
    `, [startDate.toISOString()]) as any[];

    // 3. Product Performance Analysis - Fixed column reference
    const productPerformance = await query(`
      SELECT 
        p.id,
        p.name,
        p.category,
        COALESCE(SUM(ti.quantity), 0) as total_sold,
        COALESCE(SUM(ti.price * ti.quantity), 0) as total_revenue,
        COALESCE(AVG(ti.price), 0) as avg_price,
        COALESCE(p.stock, 0) +
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0) as current_stock,
        CASE 
          WHEN (COALESCE(p.stock, 0) +
                COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0)) = 0 THEN 'Out of Stock'
          WHEN (COALESCE(p.stock, 0) +
                COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0)) <= 10 THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM products p
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.date >= ?
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id, p.name, p.category, p.stock
      ORDER BY total_revenue DESC
    `, [startDate.toISOString()]) as any[];

    // 4. Category Performance
    const categoryPerformance = await query(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(ti.quantity), 0) as total_sold,
        COALESCE(SUM(ti.price * ti.quantity), 0) as total_revenue,
        COALESCE(AVG(ti.price), 0) as avg_price
      FROM products p
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.date >= ?
      GROUP BY p.category
      ORDER BY total_revenue DESC
    `, [startDate.toISOString()]) as any[];

    // 5. Cashier Performance
    const cashierPerformance = await query(`
      SELECT 
        u.id,
        u.name,
        COUNT(DISTINCT t.id) as transactions_processed,
        COALESCE(SUM(t.total_amount), 0) as total_revenue,
        COALESCE(AVG(t.total_amount), 0) as avg_transaction_value,
        MIN(t.date) as first_transaction,
        MAX(t.date) as last_transaction
      FROM users u
      LEFT JOIN transactions t ON u.id = t.cashier_id AND t.date >= ?
      WHERE u.role = 'cashier' AND u.is_active = TRUE
      GROUP BY u.id, u.name
      ORDER BY total_revenue DESC
    `, [startDate.toISOString()]) as any[];

    // 6. Inventory Health - Fixed column reference
    const inventoryHealth = await query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN (COALESCE(p.stock, 0) +
                       COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
                       COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0)) = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN (COALESCE(p.stock, 0) +
                       COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
                       COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0)) > 0 
                   AND (COALESCE(p.stock, 0) +
                        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
                        COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0)) <= 10 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN (COALESCE(p.stock, 0) +
                       COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
                       COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0)) > 10 THEN 1 ELSE 0 END) as healthy_stock,
        COALESCE(SUM(COALESCE(p.stock, 0) +
                     COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'in' THEN sm.quantity ELSE 0 END), 0) -
                     COALESCE(SUM(CASE WHEN sm.status = 'approved' AND sm.movement_type = 'out' THEN sm.quantity ELSE 0 END), 0)), 0) as total_inventory_value
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id
    `) as any[];

    // 7. Peak Hours Analysis
    const peakHours = await query(`
      SELECT 
        HOUR(t.date) as hour,
        COUNT(DISTINCT t.id) as transactions,
        COALESCE(SUM(t.total_amount), 0) as revenue
      FROM transactions t
      WHERE t.date >= ?
      GROUP BY HOUR(t.date)
      ORDER BY hour ASC
    `, [startDate.toISOString()]) as any[];

    // 8. Growth Metrics (compare with previous period)
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    
    const currentPeriodRevenue = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM transactions
      WHERE date >= ?
    `, [startDate.toISOString()]) as any[];

    const previousPeriodRevenue = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM transactions
      WHERE date >= ? AND date < ?
    `, [previousStartDate.toISOString(), startDate.toISOString()]) as any[];

    const currentRevenue = currentPeriodRevenue[0]?.revenue || 0;
    const previousRevenue = previousPeriodRevenue[0]?.revenue || 0;
    const growthRate = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // 9. Top Selling Products (with trend)
    const topProducts = await query(`
      SELECT 
        p.name,
        p.category,
        COALESCE(SUM(ti.quantity), 0) as quantity_sold,
        COALESCE(SUM(ti.price * ti.quantity), 0) as revenue,
        COUNT(DISTINCT t.id) as transaction_count
      FROM products p
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.date >= ?
      GROUP BY p.id, p.name, p.category
      HAVING quantity_sold > 0
      ORDER BY quantity_sold DESC
      LIMIT 10
    `, [startDate.toISOString()]) as any[];

    // 10. Customer Insights (based on transaction patterns)
    const customerInsights = await query(`
      SELECT 
        COUNT(DISTINCT t.id) as unique_customers,
        COUNT(t.id) as total_transactions,
        COALESCE(AVG(t.total_amount), 0) as avg_customer_spend,
        COALESCE(MAX(t.total_amount), 0) as max_customer_spend
      FROM transactions t
      WHERE t.date >= ?
    `, [startDate.toISOString()]) as any[];

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      
      // Core Metrics
      salesMetrics: salesMetrics[0] || {},
      growthRate,
      
      // Trend Data
      dailySales,
      peakHours,
      
      // Performance Analysis
      productPerformance,
      categoryPerformance,
      cashierPerformance,
      topProducts,
      
      // Inventory Analysis
      inventoryHealth: inventoryHealth[0] || {},
      
      // Customer Insights
      customerInsights: customerInsights[0] || {},
      
      // Calculated KPIs
      kpis: {
        revenueGrowth: growthRate,
        avgTransactionValue: salesMetrics[0]?.avg_transaction_value || 0,
        totalProducts: inventoryHealth[0]?.total_products || 0,
        stockoutRate: inventoryHealth[0]?.total_products > 0 ? 
          (inventoryHealth[0]?.out_of_stock / inventoryHealth[0]?.total_products) * 100 : 0,
        inventoryTurnover: salesMetrics[0]?.total_transactions > 0 ? 
          (inventoryHealth[0]?.total_inventory_value / salesMetrics[0]?.total_transactions) : 0
      }
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ message: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
