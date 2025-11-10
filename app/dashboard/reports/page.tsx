"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import Toast from '../../components/Toast';
import { SimpleBarChart, SimpleLineChart, StatCard } from '../../components/SimpleCharts';

interface User {
  id: number;
  name: string;
  role: string;
}

interface ReportsData {
  role: string;
  [key: string]: any;
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [expandedBills, setExpandedBills] = useState<Set<number>>(new Set());
  const router = useRouter();

  const toggleBillExpand = (billId: number) => {
    const newExpanded = new Set(expandedBills);
    if (newExpanded.has(billId)) {
      newExpanded.delete(billId);
    } else {
      newExpanded.add(billId);
    }
    setExpandedBills(newExpanded);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        id: payload.userId,
        name: payload.name || 'User',
        role: payload.role
      });
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
      return;
    }
    
    fetchReports();
  }, [router]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReportsData(data);
    } catch (error: any) {
      setToastMsg(error.message || 'Failed to load reports');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchReports();
    setToastMsg('Reports refreshed!');
    setToastType('success');
    setShowToast(true);
  };

  if (loading || !user) {
    return (
      <DashboardLayout userRole={user?.role || 'user'} userName={user?.name || 'User'}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
          <div style={{ fontSize: '20px', color: '#666' }}>Loading reports...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!reportsData) {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <div style={{ fontSize: '20px', color: '#666', marginBottom: '20px' }}>
            Failed to load reports
          </div>
          <button
            onClick={handleRefresh}
            style={{
              padding: '12px 24px',
              background: '#1ecb4f',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================
  // OWNER VIEW
  // ============================================
  if (user.role === 'owner') {
    const { todayTransactions, historySummary, inventory, productPerformance } = reportsData;

    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <div>
              <h1 style={{ margin: 0, color: '#333', fontSize: '28px', fontWeight: 700 }}>
                📊 Owner Reports
              </h1>
              <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                Complete business overview and analytics
              </p>
            </div>
            <button
              onClick={handleRefresh}
              style={{
                padding: '10px 20px',
                background: '#1ecb4f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Today's Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard
              title="Today's Bills"
              value={todayTransactions.billsCount}
              icon="🧾"
              color="#007aff"
              subtitle={`Total: Rs.${todayTransactions.bills.reduce((s: number, b: any) => s + Number(b.total_amount), 0).toFixed(2)}`}
            />
            <StatCard
              title="Today's Stock Movements"
              value={todayTransactions.stockMovementsCount}
              icon="📦"
              color="#ff9500"
              subtitle="In, Out, Adjustments"
            />
            <StatCard
              title="Total Inventory Value"
              value={`Rs.${inventory.totalValue.toFixed(2)}`}
              icon="💰"
              color="#1ecb4f"
              subtitle={`${inventory.products.length} products`}
            />
            <StatCard
              title="30-Day Revenue"
              value={`Rs.${Number(historySummary.totals.total_revenue || 0).toFixed(2)}`}
              icon="📈"
              color="#8884d8"
              subtitle={`${historySummary.totals.total_transactions} transactions`}
            />
          </div>

          {/* Today's Transactions Table */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Today's Bills</h3>
            {todayTransactions.bills.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
                No bills today
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px', width: '40px' }}></th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Bill #</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Time</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Cashier</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Items</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayTransactions.bills.map((bill: any) => (
                      <React.Fragment key={bill.id}>
                        <tr 
                          style={{ 
                            borderBottom: expandedBills.has(bill.id) ? 'none' : '1px solid #f0f0f0',
                            cursor: 'pointer',
                            background: expandedBills.has(bill.id) ? '#f8f9fa' : 'transparent'
                          }}
                          onClick={() => toggleBillExpand(bill.id)}
                        >
                          <td style={{ padding: '12px', fontSize: '16px', textAlign: 'center' }}>
                            {expandedBills.has(bill.id) ? '▼' : '▶'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500 }}>{bill.transaction_number}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                            {new Date(bill.date).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{bill.cashier_name}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                            {bill.items_count} items
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, textAlign: 'right', color: '#1ecb4f' }}>
                            Rs.{Number(bill.total_amount).toFixed(2)}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: '#e8f5e8',
                              color: '#1ecb4f',
                              fontSize: '12px',
                              textTransform: 'uppercase'
                            }}>
                              {bill.payment_method}
                            </span>
                          </td>
                        </tr>
                        {expandedBills.has(bill.id) && (
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td colSpan={7} style={{ padding: '0' }}>
                              <div style={{ 
                                background: '#fafafa', 
                                padding: '16px 20px',
                                borderTop: '1px solid #e0e0e0'
                              }}>
                                <div style={{ 
                                  fontSize: '13px', 
                                  fontWeight: 600, 
                                  color: '#666', 
                                  marginBottom: '12px' 
                                }}>
                                  Products in this bill:
                                </div>
                                <table style={{ width: '100%', fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                                      <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: 500 }}>Product</th>
                                      <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: 500 }}>Category</th>
                                      <th style={{ padding: '8px', textAlign: 'right', color: '#666', fontWeight: 500 }}>Qty</th>
                                      <th style={{ padding: '8px', textAlign: 'right', color: '#666', fontWeight: 500 }}>Unit Price</th>
                                      <th style={{ padding: '8px', textAlign: 'right', color: '#666', fontWeight: 500 }}>Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bill.items && bill.items.map((item: any) => (
                                      <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px', color: '#333' }}>{item.product_name}</td>
                                        <td style={{ padding: '8px', color: '#666' }}>{item.category}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>{item.quantity}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', color: '#666' }}>Rs.{Number(item.unit_price).toFixed(2)}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#1ecb4f' }}>
                                          Rs.{Number(item.subtotal).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Today's Stock Movements Table */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Today's Stock Movements</h3>
            {todayTransactions.stockMovements.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
                No stock movements today
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Time</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Product</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>Quantity</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Performed By</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayTransactions.stockMovements.map((movement: any) => (
                      <tr key={movement.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                          {new Date(movement.created_at).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>{movement.product_name}</td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: movement.movement_type === 'in' ? '#e8f5e8' : movement.movement_type === 'out' ? '#ffebee' : '#fff3e0',
                            color: movement.movement_type === 'in' ? '#1ecb4f' : movement.movement_type === 'out' ? '#ff3b3b' : '#ff9500',
                            fontSize: '12px'
                          }}>
                            {movement.movement_type === 'in' ? '📥 IN' : movement.movement_type === 'out' ? '📤 OUT' : '🔄 ADJUST'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>
                          {movement.quantity}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>{movement.performed_by}</td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: movement.status === 'approved' ? '#e8f5e8' : '#fff3e0',
                            color: movement.status === 'approved' ? '#1ecb4f' : '#ff9500',
                            fontSize: '12px'
                          }}>
                            {movement.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Charts Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Daily Revenue Chart */}
            <SimpleLineChart
              title="30-Day Revenue Trend"
              data={(historySummary.daily || []).map((day: any) => ({
                label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: Number(day.total_revenue)
              }))}
              color="#1ecb4f"
              valuePrefix="Rs."
            />

            {/* Top Selling Products */}
            <SimpleBarChart
              title="Top Selling Products (30 Days)"
              data={(productPerformance.topSelling || []).map((product: any) => ({
                label: product.name,
                value: Number(product.total_sold)
              }))}
              color="#007aff"
            />
          </div>

          {/* More Charts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Highest Revenue Products */}
            <SimpleBarChart
              title="Highest Revenue Products (30 Days)"
              data={(productPerformance.highestRevenue || []).map((product: any) => ({
                label: product.name,
                value: Number(product.total_revenue)
              }))}
              color="#1ecb4f"
              valuePrefix="Rs."
            />

            {/* Unsold Products */}
            <SimpleBarChart
              title="Products Not Sold (Last 7 Days)"
              data={(productPerformance.unsoldProducts || []).map((product: any) => ({
                label: product.name,
                value: 1
              }))}
              color="#ff3b3b"
            />
          </div>

          {/* Inventory Value Table */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Complete Inventory Value</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>Price</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>Stock</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.products.map((product: any) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{product.name}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{product.category}</td>
                      <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right', color: '#666' }}>
                        Rs.{Number(product.price).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>
                        {product.current_stock}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right', fontWeight: 600, color: '#1ecb4f' }}>
                        Rs.{product.stock_value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8f9fa', borderTop: '2px solid #e0e0e0' }}>
                    <td colSpan={4} style={{ padding: '12px', fontSize: '16px', fontWeight: 600 }}>Total Inventory Value</td>
                    <td style={{ padding: '12px', fontSize: '18px', fontWeight: 700, textAlign: 'right', color: '#1ecb4f' }}>
                      Rs.{inventory.totalValue.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => { setShowToast(false); setToastMsg(''); }}
          duration={10000}
        />
      </DashboardLayout>
    );
  }

  // ============================================
  // STOREKEEPER VIEW
  // ============================================
  if (user.role === 'storekeeper') {
    const { inventory, stockCategories, productPerformance } = reportsData;

    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <div>
              <h1 style={{ margin: 0, color: '#333', fontSize: '28px', fontWeight: 700 }}>
                📦 Storekeeper Reports
              </h1>
              <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                Inventory and stock management overview
              </p>
            </div>
            <button
              onClick={handleRefresh}
              style={{
                padding: '10px 20px',
                background: '#1ecb4f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard
              title="Total Inventory Value"
              value={`Rs.${inventory.totalValue.toFixed(2)}`}
              icon="💰"
              color="#1ecb4f"
              subtitle={`${inventory.products.length} products`}
            />
            <StatCard
              title="In Stock"
              value={inventory.stockStatus.inStock}
              icon="✅"
              color="#1ecb4f"
              subtitle="Healthy stock levels"
            />
            <StatCard
              title="Low Stock"
              value={inventory.stockStatus.lowStock}
              icon="⚠️"
              color="#ff9500"
              subtitle="Need restock soon"
            />
            <StatCard
              title="Out of Stock"
              value={inventory.stockStatus.outOfStock}
              icon="❌"
              color="#ff3b3b"
              subtitle="Restock immediately"
            />
          </div>

          {/* Charts Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Top Selling Products */}
            <SimpleBarChart
              title="Top Selling Products (30 Days)"
              data={(productPerformance.topSelling || []).map((product: any) => ({
                label: product.name,
                value: Number(product.total_sold)
              }))}
              color="#007aff"
            />

            {/* Unsold Products */}
            <SimpleBarChart
              title="Products Not Sold (Last 7 Days)"
              data={(productPerformance.unsoldProducts || []).map((product: any) => ({
                label: product.name,
                value: 1
              }))}
              color="#ff3b3b"
            />
          </div>

          {/* Stock Status Tables */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Out of Stock Products */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#ff3b3b' }}>❌ Out of Stock ({stockCategories.outOfStock.length})</h3>
              {stockCategories.outOfStock.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>No products out of stock</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {stockCategories.outOfStock.map((product: any) => (
                    <div key={product.id} style={{
                      padding: '12px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{product.category}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ff3b3b' }}>
                        0
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Products */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#ff9500' }}>⚠️ Low Stock ({stockCategories.lowStock.length})</h3>
              {stockCategories.lowStock.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>No low stock products</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {stockCategories.lowStock.map((product: any) => (
                    <div key={product.id} style={{
                      padding: '12px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{product.category}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ff9500' }}>
                        {product.current_stock}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Complete Inventory Table */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Complete Inventory</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>Price</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>Stock</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.products.map((product: any) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{product.name}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{product.category}</td>
                      <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right', color: '#666' }}>
                        Rs.{Number(product.price).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>
                        {product.current_stock}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: product.stock_status === 'In Stock' ? '#e8f5e8' : 
                                     product.stock_status === 'Low Stock' ? '#fff3e0' : '#ffebee',
                          color: product.stock_status === 'In Stock' ? '#1ecb4f' : 
                                product.stock_status === 'Low Stock' ? '#ff9500' : '#ff3b3b',
                          fontSize: '12px'
                        }}>
                          {product.stock_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right', fontWeight: 600, color: '#1ecb4f' }}>
                        Rs.{product.stock_value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => { setShowToast(false); setToastMsg(''); }}
          duration={10000}
        />
      </DashboardLayout>
    );
  }

  // ============================================
  // CASHIER VIEW
  // ============================================
  if (user.role === 'cashier') {
    const { todayBills, historySummary } = reportsData;

    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <div>
              <h1 style={{ margin: 0, color: '#333', fontSize: '28px', fontWeight: 700 }}>
                🧾 My Bills & Sales
              </h1>
              <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                Your transaction history and performance
              </p>
            </div>
            <button
              onClick={handleRefresh}
              style={{
                padding: '10px 20px',
                background: '#1ecb4f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <StatCard
              title="Today's Bills"
              value={todayBills.count}
              icon="🧾"
              color="#007aff"
              subtitle={`Total: Rs.${todayBills.total.toFixed(2)}`}
            />
            <StatCard
              title="30-Day Total"
              value={`Rs.${Number(historySummary.totals.total_revenue || 0).toFixed(2)}`}
              icon="💰"
              color="#1ecb4f"
              subtitle={`${historySummary.totals.total_bills} bills`}
            />
            <StatCard
              title="Average Bill"
              value={`Rs.${Number(historySummary.totals.avg_bill || 0).toFixed(2)}`}
              icon="📊"
              color="#8884d8"
              subtitle="Last 30 days"
            />
          </div>

          {/* Today's Bills Table */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Today's Bills</h3>
            {todayBills.bills.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>
                No bills created today. Start selling! 🚀
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px', width: '40px' }}></th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Bill #</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Time</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Items</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '14px' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '14px' }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayBills.bills.map((bill: any) => (
                      <React.Fragment key={bill.id}>
                        <tr 
                          style={{ 
                            borderBottom: expandedBills.has(bill.id) ? 'none' : '1px solid #f0f0f0',
                            cursor: 'pointer',
                            background: expandedBills.has(bill.id) ? '#f8f9fa' : 'transparent'
                          }}
                          onClick={() => toggleBillExpand(bill.id)}
                        >
                          <td style={{ padding: '12px', fontSize: '16px', textAlign: 'center' }}>
                            {expandedBills.has(bill.id) ? '▼' : '▶'}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500 }}>{bill.transaction_number}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                            {new Date(bill.date).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                            {bill.items_count} items
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, textAlign: 'right', color: '#1ecb4f' }}>
                            Rs.{Number(bill.total_amount).toFixed(2)}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: '#e8f5e8',
                              color: '#1ecb4f',
                              fontSize: '12px',
                              textTransform: 'uppercase'
                            }}>
                              {bill.payment_method}
                            </span>
                          </td>
                        </tr>
                        {expandedBills.has(bill.id) && (
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td colSpan={6} style={{ padding: '0' }}>
                              <div style={{ 
                                background: '#fafafa', 
                                padding: '16px 20px',
                                borderTop: '1px solid #e0e0e0'
                              }}>
                                <div style={{ 
                                  fontSize: '13px', 
                                  fontWeight: 600, 
                                  color: '#666', 
                                  marginBottom: '12px' 
                                }}>
                                  Products in this bill:
                                </div>
                                <table style={{ width: '100%', fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                                      <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: 500 }}>Product</th>
                                      <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: 500 }}>Category</th>
                                      <th style={{ padding: '8px', textAlign: 'right', color: '#666', fontWeight: 500 }}>Qty</th>
                                      <th style={{ padding: '8px', textAlign: 'right', color: '#666', fontWeight: 500 }}>Unit Price</th>
                                      <th style={{ padding: '8px', textAlign: 'right', color: '#666', fontWeight: 500 }}>Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bill.items && bill.items.map((item: any) => (
                                      <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px', color: '#333' }}>{item.product_name}</td>
                                        <td style={{ padding: '8px', color: '#666' }}>{item.category}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>{item.quantity}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', color: '#666' }}>Rs.{Number(item.unit_price).toFixed(2)}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#1ecb4f' }}>
                                          Rs.{Number(item.subtotal).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8f9fa', borderTop: '2px solid #e0e0e0' }}>
                      <td colSpan={4} style={{ padding: '12px', fontSize: '16px', fontWeight: 600 }}>Today's Total</td>
                      <td style={{ padding: '12px', fontSize: '18px', fontWeight: 700, textAlign: 'right', color: '#1ecb4f' }}>
                        Rs.{todayBills.total.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Charts Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Daily Sales Chart */}
            <SimpleLineChart
              title="30-Day Sales Performance"
              data={(historySummary.daily || []).map((day: any) => ({
                label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: Number(day.total_revenue)
              }))}
              color="#1ecb4f"
              valuePrefix="Rs."
            />

            {/* Daily Bills Chart */}
            <SimpleBarChart
              title="30-Day Bill Count"
              data={(historySummary.daily || []).map((day: any) => ({
                label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: Number(day.bill_count)
              }))}
              color="#007aff"
            />
          </div>
        </div>

        <Toast
          message={toastMsg}
          type={toastType}
          onClose={() => { setShowToast(false); setToastMsg(''); }}
          duration={10000}
        />
      </DashboardLayout>
    );
  }

  return null;
} 