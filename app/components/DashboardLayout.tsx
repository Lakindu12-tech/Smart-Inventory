"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PasswordChange from './PasswordChange';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: string;
  userName: string;
}

interface PendingRequest {
  id: number;
  type: string;
  product_name?: string;
  requester_name?: string;
  created_at: string;
}

export default function DashboardLayout({ children, userRole, userName }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showReversalNotification, setShowReversalNotification] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingReversalCount, setPendingReversalCount] = useState(0);
  const router = useRouter();

  // Check for pending requests when owner logs in
  useEffect(() => {
    if (userRole === 'owner') {
      checkPendingRequests();
    }
  }, [userRole]);

  const checkPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch product requests
      const requestsRes = await fetch('/api/product-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let requests: any[] = [];
      try {
        const requestsText = await requestsRes.text();
        if (requestsText) requests = JSON.parse(requestsText);
      } catch (e) {
        console.error('Error parsing requests response:', e);
      }

      // Fetch stock movements
      const stockRes = await fetch('/api/stock?movements=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let stockData = { movements: [] };
      try {
        const stockText = await stockRes.text();
        if (stockText) stockData = JSON.parse(stockText);
      } catch (e) {
        console.error('Error parsing stock response:', e);
      }

      const pendingProductRequests = requests.filter((r: any) => r.status === 'pending');
      const pendingStockMovements = stockData.movements?.filter((m: any) => m.status === 'pending') || [];

      const totalPending = pendingProductRequests.length + pendingStockMovements.length;
      
      if (totalPending > 0) {
        setPendingCount(totalPending);
        setShowNotification(true);
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 10000);
      }

      // Fetch reversal requests
      const reversalRes = await fetch('/api/reversal-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let reversalData: any[] = [];
      try {
        const reversalText = await reversalRes.text();
        if (reversalText) reversalData = JSON.parse(reversalText);
      } catch (e) {
        console.error('Error parsing reversal response:', e);
      }

      const pendingReversals = reversalData.filter((r: any) => r.status === 'pending');
      
      if (pendingReversals.length > 0) {
        setPendingReversalCount(pendingReversals.length);
        setShowReversalNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setShowReversalNotification(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking pending requests:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotification(false);
    router.push('/dashboard/approvals');
  };

  const handleReversalNotificationClick = () => {
    setShowReversalNotification(false);
    router.push('/dashboard/bill-reversals');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return '#1ecb4f';
      case 'storekeeper': return '#ff9500';
      case 'cashier': return '#007aff';
      default: return '#666';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return '👑';
      case 'storekeeper': return '📦';
      case 'cashier': return '💰';
      default: return '👤';
    }
  };

  const getMenuItems = (role: string) => {
    const baseItems = [
      { name: 'Dashboard', icon: '📊', href: '/dashboard' }
    ];

    switch (role) {
      case 'owner':
        return [
          ...baseItems,
          { name: 'User Management', icon: '👥', href: '/dashboard/users' },
          { name: 'Product Approvals', icon: '✅', href: '/dashboard/approvals', badge: pendingCount > 0 ? pendingCount : undefined },
          { name: 'Bill Reversals', icon: '🔄', href: '/dashboard/bill-reversals' },
          { name: 'Stock Management', icon: '📋', href: '/dashboard/stock' },
          { name: 'Reports & Analytics', icon: '📊', href: '/dashboard/reports' }
        ];
      case 'storekeeper':
        return [
          ...baseItems,
          { name: 'Stock Management', icon: '📋', href: '/dashboard/stock' },
          { name: 'Price Management', icon: '💲', href: '/dashboard/products' },
          { name: 'Reports', icon: '📊', href: '/dashboard/reports' },
        ];
      case 'cashier':
        return [
          ...baseItems,
          { name: 'Sales & Billing', icon: '💰', href: '/dashboard/billing' },
          { name: 'Products', icon: '📦', href: '/dashboard/products' },
          { name: 'Bill Reversals', icon: '🔄', href: '/dashboard/reversals' },
          { name: 'Reports', icon: '📊', href: '/dashboard/reports' },
        ];
      default:
        return baseItems;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7' }}>
      {/* Notification Banner for Owner */}
      {showNotification && userRole === 'owner' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #ff9500, #ff6b35)',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(255,149,0,0.3)',
          zIndex: 2000,
          cursor: 'pointer',
          animation: 'slideIn 0.5s ease-out',
          maxWidth: '350px',
          border: '2px solid rgba(255,255,255,0.2)'
        }}
        onClick={handleNotificationClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(255,149,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,149,0,0.3)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '1.5rem' }}>🔔</div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>Pending Requests</div>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {pendingCount}
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            You have {pendingCount} pending request{pendingCount > 1 ? 's' : ''} that need your approval.
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
            Click to review → 
          </div>
        </div>
      )}

      {/* Bill Reversal Notification Banner for Owner */}
      {showReversalNotification && userRole === 'owner' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #ff3b3b, #ff6b6b)',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(255,59,59,0.3)',
          zIndex: 2001,
          cursor: 'pointer',
          animation: 'slideIn 0.5s ease-out',
          maxWidth: '350px',
          border: '2px solid rgba(255,255,255,0.2)',
          transition: 'all 0.3s ease'
        }}
        onClick={handleReversalNotificationClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(255,59,59,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,59,59,0.3)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '1.5rem' }}>🔄</div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>Bill Reversals</div>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {pendingReversalCount}
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {pendingReversalCount} pending reversal request{pendingReversalCount > 1 ? 's' : ''} need your review.
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
            Click to review → 
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{
        width: isSidebarOpen ? 280 : 80,
        background: '#fff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 1000
      }}>
        {/* Logo Section */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem'
        }}>
          <Image src="/logo192.png" alt="Logo" width={32} height={32} />
          {isSidebarOpen && (
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-green)', fontSize: '1.1rem' }}>
                SD Bandara Trading
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Inventory System</div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem'
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: getRoleColor(userRole),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}>
            {getRoleIcon(userRole)}
          </div>
          {isSidebarOpen && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{userName}</div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: getRoleColor(userRole),
                textTransform: 'capitalize',
                fontWeight: 500
              }}>
                {userRole}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {getMenuItems(userRole).map((item, index) => (
            <a
              key={index}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.8rem 1.5rem',
                color: '#333',
                textDecoration: 'none',
                transition: 'background 0.2s',
                fontSize: '0.9rem',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {isSidebarOpen && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <span>{item.name}</span>
                  {item.badge && (
                    <div style={{
                      background: '#ff9500',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      marginLeft: 'auto'
                    }}>
                      {item.badge}
                    </div>
                  )}
                </div>
              )}
            </a>
          ))}
        </nav>

        {/* Password Change Button */}
        <div style={{ padding: '1rem', borderTop: '1px solid #eee' }}>
          <button
            onClick={() => setShowPasswordChange(true)}
            style={{
              width: '100%',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.8rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}
          >
            <span>🔐</span>
            {isSidebarOpen && <span>Change Password</span>}
          </button>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'var(--danger-red)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.8rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>🚪</span>
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: isSidebarOpen ? 280 : 80,
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Header */}
        <header style={{
          background: '#fff',
          padding: '1rem 2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333' }}>
            SD Bandara Trading - Dashboard
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            {new Date().toLocaleDateString()}
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </div>
      
      {/* Password Change Modal */}
      {showPasswordChange && (
        <PasswordChange onClose={() => setShowPasswordChange(false)} />
      )}

      {/* CSS Animation for notification */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
} 