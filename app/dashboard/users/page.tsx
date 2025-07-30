"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';

interface CurrentUser {
  id: number;
  name: string;
  role: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'storekeeper'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; user: User | null }>({
    show: false,
    user: null
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const router = useRouter();

  // User authentication and role check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userData = {
        id: payload.userId,
        name: payload.name || 'User',
        role: payload.role
      };
      setCurrentUser(userData);
      
      // Only owners can access user management
      if (userData.role !== 'owner') {
        alert('Access denied. Owner only.');
        router.push('/dashboard');
        return;
      }
      
      // Fetch users after authentication
      fetchUsers();
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
      return;
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSuccess(`User created successfully! Default password: 1234`);
      setFormData({ name: '', email: '', role: 'storekeeper' });
      setShowAddForm(false);
      fetchUsers();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSuccess('User deactivated successfully');
      setDeleteConfirm({ show: false, user: null });
      fetchUsers();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'storekeeper': return '#ff9500';
      case 'cashier': return '#007aff';
      default: return '#666';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'storekeeper': return '📦';
      case 'cashier': return '💰';
      default: return '👤';
    }
  };

  // Add a logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Filtered users
  const filteredUsers = users.filter(user => {
    const matchesName = user.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesName && matchesRole;
  });

  // Role-based access control
  if (!currentUser) {
    return (
      <DashboardLayout userRole="user" userName="User">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Only owners can access this page
  if (currentUser.role !== 'owner') {
    return (
      <DashboardLayout userRole={currentUser.role} userName={currentUser.name}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h1 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '2rem' }}>Access Denied</h1>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Only owners can access user management. Please contact your administrator.
          </p>
          <a href="/dashboard" style={{
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
            Return to Dashboard
          </a>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout userRole={currentUser.role} userName={currentUser.name}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.5rem', color: '#666' }}>Loading users...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && users.length === 0) {
    return (
      <DashboardLayout userRole={currentUser.role} userName={currentUser.name}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            background: '#ff3b3b',
            color: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>❌ Error Loading Users</h2>
            <p style={{ margin: '0 0 1.5rem 0', opacity: 0.9 }}>
              {error}
            </p>
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                fetchUsers();
              }}
              style={{
                background: '#fff',
                color: '#ff3b3b',
                border: 'none',
                borderRadius: '8px',
                padding: '0.8rem 1.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={currentUser.role} userName={currentUser.name}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1ecb4f, #16a34a)',
          color: '#fff',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          boxShadow: '0 4px 16px rgba(30,203,79,0.2)'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            User Management 👥
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
            Manage Storekeepers and Cashiers for SD Bandara Trading
          </p>
        </div>

        {/* Add User Button */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
            System Users ({users.length})
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: '#1ecb4f',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.8rem 1.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            {showAddForm ? 'Cancel' : '+ Add New User'}
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>Add New User</h3>
            <form onSubmit={handleAddUser}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: '#fff'
                    }}
                    required
                  >
                    <option value="storekeeper">Storekeeper</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    background: '#1ecb4f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.8rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    background: '#ff3b3b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.8rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            background: '#ff3b3b',
            color: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            ❌ {error}
          </div>
        )}
        {success && (
          <div style={{
            background: '#1ecb4f',
            color: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            ✅ {success}
          </div>
        )}

        {/* Main Content: Two-column layout */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left: Users List Section */}
          <div style={{ flex: 2, minWidth: 0 }}>
            {/* Search/Filter Bar */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name..."
                style={{
                  flex: 1,
                  minWidth: 180,
                  maxWidth: 300,
                  padding: '0.7rem 1rem',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                style={{
                  minWidth: 140,
                  padding: '0.7rem 1rem',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: '#fff'
                }}
              >
                <option value="all">All Roles</option>
                <option value="storekeeper">Storekeeper</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
            {/* Users List */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #eee',
                background: '#f8f9fa'
              }}>
                <h3 style={{ margin: 0, color: '#333' }}>All Users</h3>
              </div>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  No users found. Try adjusting your search or filter.
                </div>
              ) : (
                <div>
                  {Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                    >
                      <div style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: getRoleColor(user.role),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}>
                        {getRoleIcon(user.role)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#333' }}>
                          {user.name}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                          {user.email}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.3rem' }}>
                          Created: {new Date(user.created_at).toISOString().slice(0, 10)}
                        </div>
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: `${getRoleColor(user.role)}20`,
                        color: getRoleColor(user.role),
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}>
                        {user.role}
                      </div>
                      <button
                        onClick={() => setDeleteConfirm({ show: true, user })}
                        style={{
                          background: '#ff3b3b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.6rem 1rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}
                      >
                        🚫 Deactivate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Right: Info Box */}
          <div style={{ flex: 1, minWidth: 260, maxWidth: 340 }}>
            <div style={{
              background: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: 0,
              position: 'sticky',
              top: 24
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>ℹ️ Important Information</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1976d2', fontSize: '0.9rem' }}>
                <li>New users are created with default password: <strong>1234</strong></li>
                <li>Users can change their password after first login</li>
                <li>Email addresses must be unique</li>
              </ul>
            </div>
          </div>
        </div>
        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && deleteConfirm.user && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>⚠️ Confirm Deactivation</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#666' }}>
                Are you sure you want to deactivate <strong>{deleteConfirm.user.name}</strong> ({deleteConfirm.user.email})?
              </p>
              <p style={{ margin: '0 0 1.5rem 0', color: '#ff3b3b', fontSize: '0.9rem' }}>
                This action cannot be undone. The user will no longer be able to login.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm.user!.id)}
                  style={{
                    background: '#ff3b3b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.8rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Yes, Deactivate User
                </button>
                <button
                  onClick={() => setDeleteConfirm({ show: false, user: null })}
                  style={{
                    background: '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.8rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 