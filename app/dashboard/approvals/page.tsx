"use client";
import { useState, useEffect } from 'react';
import Toast from '../../components/Toast';
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
  request_type: 'product_request';
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
  request_type: 'stock_movement';
}

type ApprovalItem = ProductRequest | StockMovement;

export default function ApprovalsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState({ status: 'all', type: 'all', date: '' });
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [allItems, setAllItems] = useState<ApprovalItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const router = useRouter();

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
      if (userData.role !== 'owner') {
        setToastMsg('Access denied. Owner only.');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
        return;
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (user && user.role === 'owner') {
      fetchRequests();
    }
  }, [user, filters.status]);

  useEffect(() => {
    filterRequests();
  }, [allItems, filters]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const prParams = new URLSearchParams();
      if (filters.status !== 'all') prParams.append('status', filters.status);
      const requestsResponse = await fetch(`/api/product-requests?${prParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!requestsResponse.ok) throw new Error('Failed to fetch product requests');
      const requestsData = await requestsResponse.json();
      const productRequests = Array.isArray(requestsData) ? requestsData.map((req: any) => ({ ...req, request_type: 'product_request' as const })) : [];
      setRequests(productRequests);

      const smParams = new URLSearchParams();
      smParams.append('movements', 'true');
      if (filters.status !== 'all') smParams.append('status', filters.status);
      const stockMovementsResponse = await fetch(`/api/stock?${smParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!stockMovementsResponse.ok) throw new Error('Failed to fetch stock movements');
      const stockMovementsData = await stockMovementsResponse.json();
      const movements = Array.isArray(stockMovementsData.movements) ? stockMovementsData.movements.map((movement: any) => ({ ...movement, request_type: 'stock_movement' as const, type: movement.movement_type, requester_name: movement.performed_by_name })) : [];
      setStockMovements(movements);

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

  const handleAction = () => {
    if (!selectedItem) return;
    if (actionType === 'reject' && !comment.trim()) {
      setToastMsg('Please enter a comment to reject');
      setToastType('error');
      setShowToast(true);
      return;
    }

    // Fire API call in background
    const itemId = selectedItem.id;
    const token = localStorage.getItem('token');
    
    if (selectedItem.request_type === 'product_request') {
      fetch(`/api/product-requests/${itemId}/${actionType}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ owner_comment: comment || (actionType === 'approve' ? 'Approved' : 'Rejected') })
      }).catch(() => {});
    } else if (selectedItem.request_type === 'stock_movement') {
      fetch(`/api/stock/${itemId}/${actionType}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: comment || (actionType === 'approve' ? 'Approved' : 'Rejected') })
      }).catch(() => {});
    }

    // INSTANT HARD REFRESH - like Ctrl+Shift+R
    window.location.reload();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (!user) {
    return (
      <DashboardLayout userRole="user" userName="User">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</div>
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
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: '#333', marginBottom: '1rem' }}>All Request Approvals</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Review and manage all product, price, and stock requests from storekeepers
          </p>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: 600, fontSize: '0.9rem' }}>
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
            filteredItems.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '1rem', borderBottom: '1px solid #eee', fontSize: '0.9rem', alignItems: 'center' }}>
                <div style={{ fontWeight: 500 }}>
                  {getTypeIcon(item.request_type === 'product_request' ? item.type : item.movement_type)} {item.request_type === 'stock_movement' ? item.movement_type : item.type}
                </div>
                <div>
                  {item.request_type === 'product_request' ? (
                     item.type === 'add' ? item.product_name :
                     item.type === 'price' ? `Rs.${item.requested_price}` :
                     item.requested_quantity !== undefined ? `${item.requested_quantity > 0 ? '+' : ''}${item.requested_quantity}` : ''
                  ) : (
                    `${item.movement_type === 'in' ? '+' : '-'}${item.quantity} units - ${item.product_name}`
                  )}
                </div>
                <div>{item.request_type === 'product_request' ? item.requester_name : item.performed_by_name}</div>
                <div style={{ color: getStatusColor(item.status), fontWeight: 600 }}>
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
                        onClick={() => { setSelectedItem(item); setActionType('approve'); setShowActionModal(true); }}
                        style={{ background: '#1ecb4f', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => { setSelectedItem(item); setActionType('reject'); setShowActionModal(true); }}
                        style={{ background: '#ff3b3b', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {item.status !== 'pending' && (
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                       {item.request_type === 'product_request' ? (item.owner_comment || '-') : '-'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {showToast && (
          <Toast
            message={toastMsg}
            type={toastType}
            onClose={() => { setShowToast(false); setToastMsg(''); }}
            duration={10000}
          />
        )}
      </div>
      {showActionModal && selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#333' }}>
                {actionType === 'approve' ? '✅ Approve Request' : '❌ Reject Request'}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}
              >
                ×
              </button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Request Details:</strong>
              <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <div><strong>Type:</strong> {selectedItem?.request_type === 'stock_movement' ? (selectedItem as StockMovement)?.movement_type : (selectedItem as ProductRequest)?.type}</div>
                <div><strong>Details:</strong> {selectedItem?.request_type === 'product_request'
                  ? ((selectedItem as ProductRequest)?.type === 'add'
                      ? (selectedItem as ProductRequest)?.product_name
                      : (selectedItem as ProductRequest)?.type === 'price'
                        ? `Rs.${(selectedItem as ProductRequest)?.requested_price}`
                        : `${(selectedItem as ProductRequest)?.requested_quantity} units`)
                  : `${(selectedItem as StockMovement)?.movement_type === 'in' ? '+' : '-'}${(selectedItem as StockMovement)?.quantity} units - ${(selectedItem as StockMovement)?.product_name}`}
                </div>
                <div><strong>Requester:</strong> {selectedItem?.request_type === 'product_request' ? (selectedItem as ProductRequest)?.requester_name : (selectedItem as StockMovement)?.performed_by_name}</div>
                <div><strong>Reason:</strong> {selectedItem?.reason || 'None provided'}</div>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                {actionType === 'reject' ? 'Comment (Required for rejection)' : 'Comment (Optional)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', minHeight: '80px', resize: 'vertical' }}
                placeholder={`Enter comment for ${actionType}...`}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleAction}
                disabled={actionType === 'reject' && !comment.trim()}
                style={{ background: actionType === 'approve' ? '#1ecb4f' : '#ff3b3b', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem 1.5rem', cursor: (actionType === 'reject' && !comment.trim()) ? 'not-allowed' : 'pointer', fontWeight: 600, flex: 1, opacity: (actionType === 'reject' && !comment.trim()) ? 0.5 : 1 }}
              >
                {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              </button>
              <button
                onClick={() => setShowActionModal(false)}
                style={{ background: '#666', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}