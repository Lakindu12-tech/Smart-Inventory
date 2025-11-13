"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';

interface User {
  id: number;
  name: string;
  role: string;
}

interface DashboardStats {
  outOfStockItems: number;
  lowStockItems: number;
  pendingRequests: number;
  totalProducts: number;
  todaySales: number;
  todayRevenue: number;
  approvedRequests: number;
  availableProducts: number;
}

interface RecentActivity {
  type: string;
  message: string;
  timestamp: string;
  timeMs: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    outOfStockItems: 0,
    lowStockItems: 0,
    pendingRequests: 0,
    totalProducts: 0,
    todaySales: 0,
    todayRevenue: 0,
    approvedRequests: 0,
    availableProducts: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const router = useRouter();

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
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch real-time stock data
      const stockRes = await fetch('/api/stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let stockData = { products: [] };
      try {
        const stockText = await stockRes.text();
        if (stockText) stockData = JSON.parse(stockText);
      } catch (e) {
        console.error('Error parsing stock response:', e);
      }
      const products = Array.isArray(stockData.products) ? stockData.products : [];

      // Fetch product requests for stats
      const requestsRes = await fetch('/api/product-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let requests = [];
      try {
        const requestsText = await requestsRes.text();
        if (requestsText) requests = JSON.parse(requestsText);
      } catch (e) {
        console.error('Error parsing requests response:', e);
      }

      // Fetch stock movements for stats
      const stockMovementsRes = await fetch('/api/stock?movements=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let stockMovements = [];
      try {
        const stockMovementsText = await stockMovementsRes.text();
        if (stockMovementsText) {
          const stockMovementsData = JSON.parse(stockMovementsText);
          stockMovements = Array.isArray(stockMovementsData.movements) ? stockMovementsData.movements : [];
        }
      } catch (e) {
        console.error('Error parsing stock movements response:', e);
      }

      // Fetch today's transactions for sales stats (only for cashier/owner)
      let todaySales = 0;
      let todayRevenue = 0;
      if (user?.role === 'cashier' || user?.role === 'owner') {
        try {
          const salesRes = await fetch('/api/sales?transactions=true', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const salesText = await salesRes.text();
          if (salesText) {
            const salesData = JSON.parse(salesText);
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            
            const todayTransactions = salesData.transactions?.filter((t: any) => {
              const txnDate = new Date(t.date);
              return txnDate >= startOfToday && txnDate <= endOfToday;
            }) || [];
            
            todaySales = todayTransactions.length;
            todayRevenue = todayTransactions.reduce((sum: number, t: any) => sum + (parseFloat(t.total_amount) || 0), 0);
          }
        } catch (e) {
          console.error('Error fetching sales data:', e);
        }
      }

      // Calculate stats using real-time stock
      const outOfStockItems = products.filter((p: any) => p.current_stock <= 0).length;
      const lowStockItems = products.filter((p: any) => p.current_stock <= 10 && p.current_stock > 0).length;
      const pendingProductRequests = requests.filter((r: any) => r.status === 'pending').length;
      const pendingStockMovements = stockMovements.filter((m: any) => m.status === 'pending').length;
      const pendingRequests = pendingProductRequests + pendingStockMovements;
      const totalProducts = products.length;
      const approvedRequests = requests.filter((r: any) => r.status === 'approved').length;
      const availableProducts = products.filter((p: any) => p.current_stock > 0).length;

      setStats({
        outOfStockItems,
        lowStockItems,
        pendingRequests,
        totalProducts,
        todaySales,
        todayRevenue,
        approvedRequests,
        availableProducts
      });

      // Generate recent activity from real data
      const activity: RecentActivity[] = [];
      
      // Add recent requests
      const recentRequests = requests.slice(0, 3);
      recentRequests.forEach((req: any) => {
        const createdAt = new Date(req.created_at);
        const timeAgo = getTimeAgo(createdAt);
        activity.push({
          type: 'request',
          message: `${req.type === 'add' ? 'Add' : req.type === 'price' ? 'Price change' : 'Stock change'} request for ${req.product_name || 'product'} (${req.status})`,
          timestamp: timeAgo,
          timeMs: createdAt.getTime()
        });
      });

      // Add recent stock movements
      const recentStockMovements = stockMovements.slice(0, 3);
      recentStockMovements.forEach((movement: any) => {
        const createdAt = new Date(movement.created_at);
        const timeAgo = getTimeAgo(createdAt);
        activity.push({
          type: 'movement',
          message: `${movement.movement_type} movement for ${movement.product_name} (${movement.quantity} units) - ${movement.status}`,
          timestamp: timeAgo,
          timeMs: createdAt.getTime()
        });
      });

      // Add recent transactions (for cashier/owner)
      if (user?.role === 'cashier' || user?.role === 'owner') {
        try {
          const salesRes = await fetch('/api/sales?transactions=true', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const salesText = await salesRes.text();
          if (salesText) {
            const salesData = JSON.parse(salesText);
            const recentTransactions = salesData.transactions?.slice(0, 3) || [];
            recentTransactions.forEach((t: any) => {
              const createdAt = new Date(t.date);
              const timeAgo = getTimeAgo(createdAt);
              activity.push({
                type: 'sale',
                message: `Sale #${t.id} - Rs.${t.total_amount?.toFixed(2) || '0'} (${t.items?.length || 0} items)`,
                timestamp: timeAgo,
                timeMs: createdAt.getTime()
              });
            });
          }
        } catch (e) {
          console.error('Error fetching sales data:', e);
        }
      }

      // Sort activity by timestamp (most recent first)
      activity.sort((a, b) => (b.timeMs || 0) - (a.timeMs || 0));
      setRecentActivity(activity.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Add a logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Navigation functions for clickable cards
  const navigateToStockWithFilter = (filter: string) => {
    router.push(`/dashboard/stock?filter=${filter}`);
  };

  const navigateToApprovalsWithFilter = (status: string) => {
    // Only owners can access approvals page
    if (user?.role === 'owner') {
      router.push(`/dashboard/approvals?status=${status}`);
    } else {
      alert('Access denied. Only owners can access approvals.');
    }
  };

  const renderOwnerDashboard = () => (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1ecb4f, #16a34a)',
        color: '#fff',
        padding: '2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        boxShadow: '0 4px 16px rgba(30,203,79,0.2)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
          Welcome back, {user?.name}! 👑
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
          SD Bandara Trading - Sri Lanka's trusted fresh produce vendor
        </p>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Out of Stock Items Card */}
        <div 
          onClick={() => navigateToStockWithFilter('out-of-stock')}
          style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
            border: '2px solid #ff3b3b40',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,59,59,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#ff3b3b40', padding: '0.8rem', borderRadius: '12px' }}>❗</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff3b3b' }}>{stats.outOfStockItems}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Out of Stock Items</div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => navigateToStockWithFilter('low-stock')}
          style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
            border: '2px solid #ff3b3b20',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,59,59,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#ff3b3b20', padding: '0.8rem', borderRadius: '12px' }}>🟥</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff3b3b' }}>{stats.lowStockItems}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Low Stock Items</div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => navigateToApprovalsWithFilter('pending')}
          style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
            border: '2px solid #ff950020',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,149,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#ff950020', padding: '0.8rem', borderRadius: '12px' }}>🕓</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff9500' }}>{stats.pendingRequests}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Pending Requests</div>
            </div>
          </div>
        </div>
        <div 
          onClick={() => navigateToStockWithFilter('in-stock')}
          style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
            border: '2px solid #007aff20',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,122,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', background: '#007aff20', padding: '0.8rem', borderRadius: '12px' }}>🍌</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#007aff' }}>{stats.totalProducts}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Produce Types</div>
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #1ecb4f20' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#1ecb4f20', padding: '0.8rem', borderRadius: '12px' }}>💰</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1ecb4f' }}>{stats.todaySales}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Today's Sales</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.5rem' }}>
          Quick Actions ⚡
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <a href="/dashboard/approvals" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s', border: '2px solid #ff950020' }}>
            <div style={{ fontSize: '1.5rem' }}>🕓</div>
            <div>
              <div style={{ fontWeight: 600 }}>Review Pending Requests</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Approve/Reject stock & price changes</div>
            </div>
          </a>
          <a href="/dashboard/users" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s', border: '2px solid #007aff20' }}>
            <div style={{ fontSize: '1.5rem' }}>👥</div>
            <div>
              <div style={{ fontWeight: 600 }}>Manage Users</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Add Storekeepers & Cashiers</div>
            </div>
          </a>
          <a href="/dashboard/stock" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s', border: '2px solid #1ecb4f20' }}>
            <div style={{ fontSize: '1.5rem' }}>🍍</div>
            <div>
              <div style={{ fontWeight: 600 }}>View Inventory</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Full produce inventory overview</div>
            </div>
          </a>
          <a href="/dashboard/reports" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s', border: '2px solid #ff3b3b20' }}>
            <div style={{ fontSize: '1.5rem' }}>🧾</div>
            <div>
              <div style={{ fontWeight: 600 }}>Reports & Analytics</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Sales reports and insights</div>
            </div>
          </a>
        </div>
      </div>
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
          Recent Activity 📊
        </h3>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {recentActivity.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
              No recent activity
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} style={{ padding: '0.5rem 0', borderBottom: index < recentActivity.length - 1 ? '1px solid #eee' : 'none' }}>
                🕐 {activity.timestamp} - {activity.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderStorekeeperDashboard = () => (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #ff9500, #e67e22)',
        color: '#fff',
        padding: '2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        boxShadow: '0 4px 16px rgba(255,149,0,0.2)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
          Welcome back, {user?.name}! 📦
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
          Fresh Produce Inventory - Submit requests for stock updates and price changes
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div 
          onClick={() => navigateToStockWithFilter('all')}
          style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid #ff950020',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,149,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#ff950020', padding: '0.8rem', borderRadius: '12px' }}>
              📊
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff9500' }}>{stats.totalProducts}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Products</div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigateToStockWithFilter('out-of-stock')}
          style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid #ff3b3b40',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,59,59,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#ff3b3b40', padding: '0.8rem', borderRadius: '12px' }}>❗</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff3b3b' }}>{stats.outOfStockItems}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Out of Stock Items</div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigateToStockWithFilter('low-stock')}
          style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid #ff3b3b20',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,59,59,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#ff3b3b20', padding: '0.8rem', borderRadius: '12px' }}>
              🛑
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff3b3b' }}>{stats.lowStockItems}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Low Stock Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.5rem' }}>
          Quick Actions ⚡
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <a href="/dashboard/products" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s', border: '2px solid #1ecb4f20' }}>
            <div style={{ fontSize: '1.5rem' }}>📝</div>
            <div>
              <div style={{ fontWeight: 600 }}>Submit Price Change</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Change the price of product</div>
            </div>
          </a>
          <a href="/dashboard/stock" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s', border: '2px solid #ff950020' }}>
            <div style={{ fontSize: '1.5rem' }}>📦</div>
            <div>
              <div style={{ fontWeight: 600 }}>Stock Management</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Submit stock movements</div>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: '#fff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
          Recent Activity 📊
        </h3>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {recentActivity.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
              No recent activity
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} style={{ padding: '0.5rem 0', borderBottom: index < recentActivity.length - 1 ? '1px solid #eee' : 'none' }}>
                🕐 {activity.timestamp} - {activity.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderCashierDashboard = () => (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #007aff, #0056b3)',
        color: '#fff',
        padding: '2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        boxShadow: '0 4px 16px rgba(0,122,255,0.2)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
          Welcome back, {user?.name}! 💰
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
          Point of Sale - Create sales transactions and generate invoices
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #007aff20'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#007aff20', padding: '0.8rem', borderRadius: '12px' }}>
              🛒
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#007aff' }}>{stats.todaySales}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Today's Sales</div>
            </div>
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #1ecb4f20'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#1ecb4f20', padding: '0.8rem', borderRadius: '12px' }}>
              💰
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1ecb4f' }}>Rs. {stats.todayRevenue.toFixed(2)}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Today's Revenue</div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigateToStockWithFilter('in-stock')}
          style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid #ff950020',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,149,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#ff950020', padding: '0.8rem', borderRadius: '12px' }}>
              📦
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff9500' }}>{stats.availableProducts}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Available Products</div>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigateToStockWithFilter('out-of-stock')}
          style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid #ff3b3b40',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,59,59,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', background: '#ff3b3b40', padding: '0.8rem', borderRadius: '12px' }}>
              ❗
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff3b3b' }}>{stats.outOfStockItems}</div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>Out of Stock Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* POS Interface */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.5rem' }}>
          Point of Sale 🛒
        </h2>
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Sales & Billing System</h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Access the full POS system with product search, cart management, customer creation, and receipt generation.
            </p>
            <a href="/dashboard/billing" style={{
              background: '#007aff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '1rem 2rem',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: '1.1rem',
              transition: 'background 0.2s'
            }}>
              Open Sales & Billing →
            </a>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{
        background: '#fff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
          Recent Transactions 🧾
        </h3>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {recentActivity.filter(a => a.type === 'sale').length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
              No recent transactions
            </div>
          ) : (
            recentActivity.filter(a => a.type === 'sale').map((activity, index) => (
              <div key={index} style={{ padding: '0.5rem 0', borderBottom: index < recentActivity.filter(a => a.type === 'sale').length - 1 ? '1px solid #eee' : 'none' }}>
                🕐 {activity.timestamp} - {activity.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f7f7f7' }}>
        <div style={{ fontSize: '1.5rem', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout userRole={user.role} userName={user.name}>
      {user.role === 'owner' && renderOwnerDashboard()}
      {user.role === 'storekeeper' && renderStorekeeperDashboard()}
      {user.role === 'cashier' && renderCashierDashboard()}
    </DashboardLayout>
  );
} 