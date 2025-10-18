"use client";
import { useState, useEffect } from 'react';
import Toast from '../../components/Toast';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  SalesTrendChart, 
  ProductPerformanceChart, 
  CategoryPieChart, 
  PeakHoursChart, 
  CashierPerformanceChart, 
  InventoryHealthRadarChart 
} from '../../components/AdvancedCharts';
import { AdvancedDataGrid, productColumns, salesColumns, cashierColumns } from '../../components/AdvancedDataGrid';
import { KPIGrid, createSalesKPIs, createInventoryKPIs, createPerformanceKPIs } from '../../components/KPICards';
import { Calendar, BarChart3, PieChart, TrendingUp, Download, RefreshCw, Filter } from 'lucide-react';

interface User {
  id: number;
  name: string;
  role: string;
}

interface AnalyticsData {
  period: string;
  startDate: string;
  endDate: string;
  salesMetrics: any;
  growthRate: number;
  dailySales: any[];
  peakHours: any[];
  productPerformance: any[];
  categoryPerformance: any[];
  cashierPerformance: any[];
  topProducts: any[];
  inventoryHealth: any;
  customerInsights: any;
  kpis: any;
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

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

    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error: any) {
      setToastMsg(error.message);
      setToastType('error');
      setShowToast(true);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const handleExportAll = () => {
    // Export all data as a comprehensive report
    const reportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      analytics: analyticsData
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Role-based access control

  if (!user) {
    return (
      <DashboardLayout userRole="user" userName="User">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#666' }}>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Cashier: show only own sales, product stock/price
  if (user.role === 'cashier') {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
          <h1 style={{ color: '#333', fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
            🧾 My Sales & Product Info
          </h1>
          <div style={{ marginBottom: '30px' }}>
            <KPIGrid kpis={createSalesKPIs({ ...analyticsData, dailySales: analyticsData?.dailySales?.filter(s => s.cashier_id === user.id) })} />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <AdvancedDataGrid
              data={analyticsData?.dailySales?.filter(s => s.cashier_id === user.id) || []}
              columns={salesColumns}
              title="My Sales Report"
              height={400}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <AdvancedDataGrid
              data={analyticsData?.productPerformance || []}
              columns={productColumns}
              title="Product Stock & Price"
              height={400}
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

  // Storekeeper and owner: full analytics
  if (user.role !== 'owner' && user.role !== 'storekeeper') {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#666' }}>Access Denied</div>
          <div style={{ fontSize: '16px', color: '#999', marginTop: '10px' }}>
            Only owners and storekeepers can access advanced analytics.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#666' }}>Loading Analytics...</div>
          <div style={{ fontSize: '16px', color: '#999', marginTop: '10px' }}>
            Preparing your business intelligence dashboard...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#ff3b3b' }}>Error Loading Analytics</div>
          <div style={{ fontSize: '16px', color: '#666', marginTop: '10px' }}>{error}</div>
          <button
            onClick={fetchAnalyticsData}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#1ecb4f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
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

  return (
    <DashboardLayout userRole={user.role} userName={user.name}>
      <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#333', fontSize: '32px', fontWeight: 700 }}>
              📊 Advanced Analytics
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '16px' }}>
              Business Intelligence Dashboard - {selectedPeriod.toUpperCase()} Analysis
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: '#f0f0f0',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>

            <button
              onClick={handleExportAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: '#1ecb4f',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '2px', 
          background: '#e0e0e0', 
          borderRadius: '8px', 
          padding: '4px',
          marginBottom: '30px'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
            { id: 'sales', label: 'Sales Analytics', icon: <TrendingUp size={16} /> },
            { id: 'inventory', label: 'Inventory', icon: <PieChart size={16} /> },
            { id: 'performance', label: 'Performance', icon: <Calendar size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#333' : '#666',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards */}
            <KPIGrid kpis={createSalesKPIs(analyticsData!)} />
            
            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <SalesTrendChart 
                data={analyticsData!.dailySales} 
                title="Sales Trend Analysis" 
                height={300}
              />
              <CategoryPieChart 
                data={analyticsData!.categoryPerformance} 
                title="Revenue by Category" 
                height={300}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <PeakHoursChart 
                data={analyticsData!.peakHours} 
                title="Peak Business Hours" 
                height={300}
              />
              <InventoryHealthRadarChart 
                data={analyticsData!.inventoryHealth} 
                title="Inventory Health Overview" 
                height={300}
              />
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div>
            <KPIGrid kpis={createSalesKPIs(analyticsData!)} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <SalesTrendChart 
                data={analyticsData!.dailySales} 
                title="Daily Sales Trend" 
                height={350}
              />
              <PeakHoursChart 
                data={analyticsData!.peakHours} 
                title="Peak Hours Analysis" 
                height={350}
              />
            </div>

            <AdvancedDataGrid
              data={analyticsData!.topProducts}
              columns={productColumns}
              title="Top Performing Products"
              height={400}
            />
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <KPIGrid kpis={createInventoryKPIs(analyticsData!)} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <ProductPerformanceChart 
                data={analyticsData!.productPerformance} 
                title="Product Performance" 
                height={350}
              />
              <InventoryHealthRadarChart 
                data={analyticsData!.inventoryHealth} 
                title="Inventory Health" 
                height={350}
              />
            </div>

            <AdvancedDataGrid
              data={analyticsData!.productPerformance}
              columns={productColumns}
              title="Product Performance Details"
              height={400}
            />
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <KPIGrid kpis={createPerformanceKPIs(analyticsData!)} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <CashierPerformanceChart 
                data={analyticsData!.cashierPerformance} 
                title="Cashier Performance" 
                height={350}
              />
              <CategoryPieChart 
                data={analyticsData!.categoryPerformance} 
                title="Category Performance" 
                height={350}
              />
            </div>

            <AdvancedDataGrid
              data={analyticsData!.cashierPerformance}
              columns={cashierColumns}
              title="Cashier Performance Details"
              height={400}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
} 