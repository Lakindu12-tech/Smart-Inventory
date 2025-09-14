"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';

interface User {
  id: number;
  name: string;
  role: string;
}

interface ProductRequest {
  id: number;
  type: 'add' | 'price' | 'stock';
  product_name?: string;
  product_id?: number;
  requested_price?: string;
  requested_quantity?: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  owner_comment?: string;
  created_at: string;
  updated_at?: string;
  requester_name: string;
  request_type: 'product_request'; // To distinguish from stock movements
}

interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  performed_by: number;
  performed_by_name: string;
  approved_by?: number;
  approved_by_name?: string;
  created_at: string;
  updated_at?: string;
  request_type: 'stock_movement'; // To distinguish from product requests
}

type ApprovalItem = ProductRequest | StockMovement;

export default function ApprovalsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [allItems, setAllItems] = useState<ApprovalItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    date: ''
  });
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
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
      setUser(userData);
      
      // Only owners can access approvals page
      if (userData.role !== 'owner') {
        alert('Access denied. Owner only.');
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
      return;
    }
  }, [router]);

  // Handle URL parameters for automatic filtering
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      
      if (status) {
        setFilters(prev => ({ ...prev, status }));
      }
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'owner') {
      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    filterRequests();
  }, [allItems, filters]);

  // Refetch when status filter changes to leverage backend filtering (DB-accurate)
  useEffect(() => {
    if (user && user.role === 'owner') {
      fetchRequests();
    }
  }, [filters.status]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch product requests
      const prParams = new URLSearchParams();
      if (filters.status !== 'all') prParams.append('status', filters.status);
      const requestsResponse = await fetch(`/api/product-requests?${prParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!requestsResponse.ok) {
        throw new Error('Failed to fetch product requests');
      }
      const requestsData = await requestsResponse.json();
      const productRequests = Array.isArray(requestsData) ? requestsData.map((req: any) => ({
        ...req,
        request_type: 'product_request' as const
      })) : [];
      setRequests(productRequests);

      // Fetch stock movements
      const smParams = new URLSearchParams();
      smParams.append('movements', 'true');
      if (filters.status !== 'all') smParams.append('status', filters.status);
      const stockMovementsResponse = await fetch(`/api/stock?${smParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!stockMovementsResponse.ok) {
        throw new Error('Failed to fetch stock movements');
      }
      const stockMovementsData = await stockMovementsResponse.json();
      const movements = Array.isArray(stockMovementsData.movements) ? stockMovementsData.movements.map((movement: any) => ({
        ...movement,
        request_type: 'stock_movement' as const,
        type: movement.movement_type, // Map movement_type to type for consistency
        requester_name: movement.performed_by_name // Map performed_by_name to requester_name
      })) : [];
      setStockMovements(movements);

      // Combine both types of requests
      const combinedItems = [...productRequests, ...movements];
      setAllItems(combinedItems);

    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...allItems];
    if (filters.status !== 'all') {
      const wanted = String(filters.status).toLowerCase().trim();
      filtered = filtered.filter(item => String(item.status).toLowerCase().trim() === wanted);
    }
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => {
        if (item.request_type === 'product_request') {
          return item.type === filters.type;
        } else if (item.request_type === 'stock_movement') {
          return item.movement_type === filters.type;
        }
        return false;
      });
    }
    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString();
      filtered = filtered.filter(item => {
        const dateStr = (item as any).updated_at || item.created_at;
        return new Date(dateStr).toDateString() === filterDate;
      });
    }
    filtered = filtered.sort((a, b) => {
      const aDate = new Date(((a as any).updated_at || a.created_at));
      const bDate = new Date(((b as any).updated_at || b.created_at));
      return bDate.getTime() - aDate.getTime();
    });
    setFilteredItems(filtered);
  };

  const handleAction = async () => {
    if (!selectedItem) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      
      let response;
      if (actionType === 'reject' && !comment.trim()) {
        throw new Error('Please enter a comment to reject');
      }

      if (selectedItem.request_type === 'product_request') {
        // Handle product request approval/rejection
        response = await fetch(`/api/product-requests/${selectedItem.id}/${actionType}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ comment })
        });
      } else if (selectedItem.request_type === 'stock_movement') {
        // Handle stock movement approval/rejection
        response = await fetch(`/api/stock/${selectedItem.id}/${actionType}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ comment })
        });
      } else {
        throw new Error('Unknown request type');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${actionType} request`);
      }

      alert(`Request ${actionType}d successfully!`);
      setShowActionModal(false);
      setSelectedItem(null);
      setComment('');
      fetchRequests(); // Refresh data
    } catch (error: any) {
      alert(`Error ${actionType}ing request: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#1ecb4f';
      case 'rejected': return '#ff3b3b';
      case 'pending': return '#ff9500';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'add': return '📦';
      case 'price': return '💰';
      case 'stock': return '📊';
      case 'in': return '📥';
      case 'out': return '📤';
      case 'adjustment': return '⚖️';
      default: return '📋';
    }
  };

  // Add a logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Role-based access control
  if (!user) {
    return (
      <DashboardLayout userRole="user" userName="User">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Only owners can access this page
  if (user.role !== 'owner') {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h1 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '2rem' }}>Access Denied</h1>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Only owners can access the approvals page. Please contact your administrator.
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
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user.role} userName={user.name}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: '#333', marginBottom: '1rem' }}>All Request Approvals</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Review and manage all product, price, and stock requests from storekeepers
          </p>
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 180 }}>
            <label style={{ fontWeight: 500, fontSize: '0.9rem', margin: 0 }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              style={{
                width: 110,
                padding: '0.5rem',
                border: '1.5px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '0.9rem',
                margin: 0
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 180 }}>
            <label style={{ fontWeight: 500, fontSize: '0.9rem', margin: 0 }}>Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              style={{
                width: 130,
                padding: '0.5rem',
                border: '1.5px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '0.9rem',
                margin: 0
              }}
            >
              <option value="all">All Types</option>
              <option value="add">Add Product</option>
              <option value="price">Price Change</option>
              <option value="stock">Stock Change</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Stock Adjustment</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 180 }}>
            <label style={{ fontWeight: 500, fontSize: '0.9rem', margin: 0 }}>Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={e => setFilters({...filters, date: e.target.value})}
              style={{
                width: 140,
                padding: '0.5rem',
                border: '1.5px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '0.9rem',
                margin: 0
              }}
            />
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#666', minWidth: 180, textAlign: 'right', alignSelf: 'center' }}>
            Showing {filteredItems.length} of {allItems.length} requests
          </div>
        </div>

        {/* Requests Table */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr',
            padding: '1rem',
            background: '#f8f9fa',
            borderBottom: '1px solid #eee',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            <div>Type</div>
            <div>Details</div>
            <div>Requester</div>
            <div>Status</div>
            <div>Date</div>
            <div>Reason</div>
            <div>Actions</div>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No requests found matching the filters.
            </div>
          ) : (
            Array.isArray(filteredItems) && filteredItems.map(item => (
              <div key={item.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                padding: '1rem',
                borderBottom: '1px solid #eee',
                fontSize: '0.9rem',
                alignItems: 'center'
              }}>
                <div style={{ fontWeight: 500 }}>
                  {getTypeIcon(item.type)} {item.request_type === 'stock_movement' ? item.movement_type : item.type}
                </div>
                <div>
                  {item.request_type === 'product_request' ? (
                    item.type === 'add' ? item.product_name :
                    item.type === 'price' ? `Rs.${item.requested_price}` :
                    `${item.requested_quantity > 0 ? '+' : ''}${item.requested_quantity}`
                  ) : (
                    // Stock movement display
                    `${item.movement_type === 'in' ? '+' : '-'}${item.quantity} units - ${item.product_name}`
                  )}
                </div>
                <div>{item.request_type === 'product_request' ? item.requester_name : item.performed_by_name}</div>
                <div style={{ 
                  color: getStatusColor(item.status),
                  fontWeight: 600
                }}>
                  {getStatusIcon(item.status)} {item.status}
                </div>
                <div>
                  {new Date(item.created_at).toISOString().slice(0, 10)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {item.reason || '-'}
                </div>
                <div>
                  {item.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setActionType('approve');
                          setShowActionModal(true);
                        }}
                        style={{
                          background: '#1ecb4f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 500
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setActionType('reject');
                          setShowActionModal(true);
                        }}
                        style={{
                          background: '#ff3b3b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 500
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {item.status !== 'pending' && (
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      {item.owner_comment || '-'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Modal */}
        {showActionModal && selectedItem && (
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
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              maxWidth: '500px',
              width: '90%'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ margin: 0, color: '#333' }}>
                  {actionType === 'approve' ? '✅ Approve Request' : '❌ Reject Request'}
                </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>Request Details:</strong>
                <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div><strong>Type:</strong> {selectedItem.request_type === 'stock_movement' ? selectedItem.movement_type : selectedItem.type}</div>
                  <div><strong>Details:</strong> {
                    selectedItem.request_type === 'product_request' ? (
                      selectedItem.type === 'add' ? selectedItem.product_name :
                      selectedItem.type === 'price' ? `Rs.${selectedItem.requested_price}` :
                      `${selectedItem.requested_quantity} units`
                    ) : (
                      `${selectedItem.movement_type === 'in' ? '+' : '-'}${selectedItem.quantity} units - ${selectedItem.product_name}`
                    )
                  }</div>
                  <div><strong>Requester:</strong> {selectedItem.request_type === 'product_request' ? selectedItem.requester_name : selectedItem.performed_by_name}</div>
                  <div><strong>Reason:</strong> {selectedItem.reason || 'None provided'}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  {actionType === 'reject' ? 'Comment (Required for rejection)' : 'Comment (Optional)'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '1.5px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder={`Enter comment for ${actionType}...`}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleAction}
                  disabled={processing || (actionType === 'reject' && !comment.trim())}
                  style={{
                    background: actionType === 'approve' ? '#1ecb4f' : '#ff3b3b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.8rem 1.5rem',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    flex: 1,
                    opacity: processing ? 0.7 : 1
                  }}
                >
                  {processing ? 'Processing...' : actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                </button>
                <button
                  onClick={() => setShowActionModal(false)}
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