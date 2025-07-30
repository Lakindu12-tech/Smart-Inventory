"use client";
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useRef } from 'react';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportData {
  sales: any[];
  inventory: any[];
  transactions: any[];
  users: any[];
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    sales: [],
    inventory: [],
    transactions: [],
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('today');
  // New state for advanced filters and chart
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [salesTransactions, setSalesTransactions] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState('');
  const [chartType, setChartType] = useState<'line'|'bar'|'pie'>('line');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productId, setProductId] = useState('');
  const [userId, setUserId] = useState('');
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
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
      window.location.href = '/';
      return;
    }

    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData({
        sales: Array.isArray(data.sales) ? data.sales : [],
        inventory: Array.isArray(data.inventory) ? data.inventory : [],
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        users: Array.isArray(data.users) ? data.users : []
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sales report from new API
  useEffect(() => {
    if (selectedReport !== 'sales') return;
    setSalesLoading(true);
    setSalesError('');
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (productId) params.append('productId', productId);
    if (userId) params.append('userId', userId);
    params.append('groupBy', dateRange === 'week' ? 'week' : dateRange === 'month' ? 'month' : 'day');
    fetch(`/api/reports/sales?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setSalesSummary(data.summary);
        setSalesTransactions(data.transactions);
        setSalesLoading(false);
        // Draw chart
        if (chartRef.current && data.summary) {
          const ctx = chartRef.current.getContext('2d');
          if (ctx) {
            if (window.salesChart) window.salesChart.destroy();
            window.salesChart = new Chart(ctx, {
              type: chartType,
              data: {
                labels: data.summary.salesByPeriod.map((p: any) => p.period),
                datasets: [{
                  label: 'Sales',
                  data: data.summary.salesByPeriod.map((p: any) => p.total),
                  backgroundColor: '#1ecb4f',
                  borderColor: '#16a34a',
                  fill: chartType === 'line',
                }]
              },
              options: { responsive: true, plugins: { legend: { display: true } } }
            });
          }
        }
      })
      .catch(e => {
        setSalesError('Failed to fetch sales report');
        setSalesLoading(false);
      });
  }, [selectedReport, startDate, endDate, productId, userId, dateRange, chartType]);

  // Download as PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Sales Report', 14, 16);
    doc.text(`Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 16)}`, 14, 24);
    if (salesSummary) {
      doc.text(`Total Transactions: ${salesSummary.totalTransactions}`, 14, 32);
      doc.text(`Total Sales: Rs.${Number(salesSummary.totalSales).toFixed(2)}`, 14, 40);
    }
    // Chart image
    if (chartRef.current) {
      const chartImg = chartRef.current.toDataURL('image/png');
      doc.addImage(chartImg, 'PNG', 14, 48, 180, 60);
    }
    // Table
    if (salesTransactions.length) {
      const tableData = salesTransactions.map(tx => [
        tx.id, tx.date, tx.cashier, tx.total_amount, tx.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')
      ]);
      (doc as any).autoTable({
        head: [['ID', 'Date', 'Cashier', 'Total', 'Items']],
        body: tableData,
        startY: 110
      });
    }
    doc.save('sales-report.pdf');
  };

  // Download as Excel
  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(salesTransactions.map(tx => ({
      ID: tx.id,
      Date: tx.date,
      Cashier: tx.cashier,
      Total: tx.total_amount,
      Items: tx.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, 'sales-report.xlsx');
  };

  // Add a logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'Today';
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs.${amount.toFixed(2)}`;
  };

  const calculateTotalSales = () => {
    return reportData.transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  };

  const calculateTotalItems = () => {
    return reportData.transactions.reduce((sum, t) => sum + t.items.length, 0);
  };

  const getTopProducts = () => {
    const productSales: { [key: string]: number } = {};
    reportData.transactions.forEach(t => {
      t.items.forEach((item: any) => {
        productSales[item.product_name] = (productSales[item.product_name] || 0) + Number(item.quantity);
      });
    });
    return Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getLowStockProducts = () => {
    return reportData.inventory.filter(item => item.current_stock < 10);
  };

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role || 'owner'} userName={user?.name || 'User'}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.5rem', color: '#666' }}>Loading reports...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user?.role || 'owner'} userName={user?.name || 'User'}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1ecb4f, #16a34a)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
            📊 Reports & Analytics
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            Comprehensive business insights for SD Bandara Trading
          </p>
        </div>

        {/* Date Range Selector */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              background: 'white'
            }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Report Type Selector */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {['sales', 'inventory', 'financial', 'users'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedReport(type)}
              style={{
                background: selectedReport === type ? '#1ecb4f' : '#f0f0f0',
                color: selectedReport === type ? 'white' : '#333',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#ff3b3b',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Sales Report */}
        {selectedReport === 'sales' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#333' }}>
              Sales Report - {getDateRangeLabel(dateRange)}
            </h2>
            {/* Filter Controls */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }} />
              {/* Product and User selectors can be added here if needed */}
              <select value={chartType} onChange={e => setChartType(e.target.value as any)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
              <button onClick={handleDownloadPDF} style={{ background: '#1ecb4f', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Download PDF</button>
              <button onClick={handleDownloadExcel} style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Download Excel</button>
            </div>
            {/* Chart */}
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <canvas ref={chartRef} width={600} height={200} />
            </div>
            {/* Summary Cards */}
            {salesSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#1976d2' }}>{`Rs.${Number(salesSummary.totalSales).toFixed(2)}`}</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Total Sales</div>
                </div>
                <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#2e7d32' }}>{salesSummary.totalTransactions}</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Transactions</div>
                </div>
                <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#f57c00' }}>{salesTransactions.reduce((sum, t) => sum + t.items.length, 0)}</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Items Sold</div>
                </div>
              </div>
            )}
            {/* Top Products */}
            {salesSummary && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Top Selling Products</h3>
                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                  {salesSummary.topProducts.map((prod: any, idx: number) => (
                    <div key={prod.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < salesSummary.topProducts.length - 1 ? '1px solid #eee' : 'none' }}>
                      <span style={{ fontWeight: 500 }}>{prod.name}</span>
                      <span style={{ color: '#666' }}>{prod.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Transactions Table */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Recent Transactions</h3>
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {Array.isArray(salesTransactions) && salesTransactions.slice(0, 10).map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>TXN-{tx.id}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>{new Date(tx.date).toISOString().replace('T', ' ').slice(0, 16)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#1ecb4f' }}>{`Rs.${Number(tx.total_amount).toFixed(2)}`}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>{tx.items.length} items</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Report */}
        {selectedReport === 'inventory' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#333' }}>
              Inventory Report - {getDateRangeLabel(dateRange)}
            </h2>

            {/* Low Stock Alert */}
            {getLowStockProducts().length > 0 && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#856404' }}>⚠️ Low Stock Alert</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {getLowStockProducts().map(product => (
                    <span key={product.id} style={{
                      background: '#ff6b6b',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {product.name} ({product.current_stock}kg)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory Table */}
            <div style={{ maxHeight: '500px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Stock (kg)</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Price/kg</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(reportData.inventory) && reportData.inventory.map(product => (
                    <tr key={product.id} style={{
                      background: product.current_stock < 10 ? '#fff5f5' : 'white'
                    }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        {product.name}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right', 
                        borderBottom: '1px solid #eee',
                        color: product.current_stock < 10 ? '#ff3b3b' : 'inherit'
                      }}>
                        {product.current_stock}kg
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                        {formatCurrency(Number(product.price))}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                        {formatCurrency(Number(product.price) * product.current_stock)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Financial Report */}
        {selectedReport === 'financial' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#333' }}>
              Financial Report - {getDateRangeLabel(dateRange)}
            </h2>

            {/* Financial Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{
                background: '#e8f5e8',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#2e7d32' }}>
                  {formatCurrency(calculateTotalSales())}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Total Revenue</div>
              </div>

              <div style={{
                background: '#e3f2fd',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#1976d2' }}>
                  {reportData.transactions.length}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Total Orders</div>
              </div>

              <div style={{
                background: '#fff3e0',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#f57c00' }}>
                  {formatCurrency(calculateTotalSales() / Math.max(reportData.transactions.length, 1))}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Average Order Value</div>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Payment Method Breakdown</h3>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                {Object.entries(
                  reportData.transactions.reduce((acc: any, t) => {
                    const method = t.payment_method || 'cash';
                    acc[method] = (acc[method] || 0) + Number(t.total_amount);
                    return acc;
                  }, {})
                ).map(([method, amount]) => (
                  <div key={method} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{method}</span>
                    <span style={{ fontWeight: 600, color: '#1ecb4f' }}>
                      {formatCurrency(Number(amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Activity Report */}
        {selectedReport === 'users' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#333' }}>
              User Activity Report - {getDateRangeLabel(dateRange)}
            </h2>

            {/* User Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{
                background: '#e3f2fd',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#1976d2' }}>
                  {reportData.users.filter(u => u.role === 'cashier').length}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Cashiers</div>
              </div>

              <div style={{
                background: '#e8f5e8',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#2e7d32' }}>
                  {reportData.users.filter(u => u.role === 'storekeeper').length}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Storekeepers</div>
              </div>

              <div style={{
                background: '#fff3e0',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#f57c00' }}>
                  {reportData.users.length}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Total Users</div>
              </div>
            </div>

            {/* User List */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Active Users</h3>
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {reportData.users.map(user => (
                  <div key={user.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderBottom: '1px solid #eee',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {user.email}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      background: user.role === 'cashier' ? '#e3f2fd' : '#e8f5e8',
                      color: user.role === 'cashier' ? '#1976d2' : '#2e7d32',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {user.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 