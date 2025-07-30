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

export default function DashboardLayout({ children, userRole, userName }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const router = useRouter();

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
          { name: 'Product Approvals', icon: '✅', href: '/dashboard/approvals' },
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
          { name: 'Reports', icon: '📊', href: '/dashboard/reports' },
        ];
      default:
        return baseItems;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7' }}>
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
                fontSize: '0.9rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {isSidebarOpen && <span>{item.name}</span>}
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
    </div>
  );
} 