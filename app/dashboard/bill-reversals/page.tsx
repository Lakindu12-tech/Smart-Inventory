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

interface ReversalRequest {
  id: number;
  transaction_id: number;
  transaction_number: string;
  total_amount: string;
  cashier_id: number;
  cashier_name: string;
  cashier_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  owner_comment?: string;
  approved_by?: number;
  created_at: string;
  updated_at?: string;
}

export default function BillReversalsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reversalRequests, setReversalRequests] = useState<ReversalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ReversalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ReversalRequest | null>(null);
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
        setTimeout(() => router.push('/dashboard'), 1500);
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
  }, [user]);

  useEffect(() => {
    filterRequests();
  }, [reversalRequests, statusFilter]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reversal-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch reversal requests');
      const data = await response.json();
      setReversalRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reversal requests:', error);
      setToastMsg('Failed to load reversal requests');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...reversalRequests];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    filtered = filtered.sort((a, b) => {
      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return bDate.getTime() - aDate.getTime();
    });
    setFilteredRequests(filtered);
  };

  const handleAction = async () => {
    if (!selectedRequest) return;
    if (actionType === 'reject' && !comment.trim()) {
      setToastMsg('Please enter a comment to reject');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/reversal-requests/${selectedRequest.id}/${actionType}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          owner_comment: comment || (actionType === 'approve' ? 'Approved' : 'Rejected') 
        })
      });
    } catch (error) {
      console.error('Error processing request:', error);
    }

    // Reload page after API completes
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

  if (!user) {
    return (
      <DashboardLayout userRole="user" userName="User">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</div>
        </div>
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
            Only owners can access bill reversal approvals.
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
            fontSize: '1.1rem'
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
          <h1 style={{ margin: 0, color: '#333', marginBottom: '1rem' }}>Bill Reversal Requests</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Review and manage bill reversal requests from cashiers
          </p>
        </div>

        {/* Filter Section */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 500, color: '#333' }}>Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1.5px solid #e0e0e0',
                fontSize: '0.95rem',
                cursor: 'pointer',
                background: '#fff'
              }}
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div style={{ marginLeft: 'auto', color: '#666', fontSize: '0.9rem' }}>
              Total: {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
            </div>
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
            gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr 1fr', 
            padding: '1rem', 
            background: '#f8f9fa', 
            borderBottom: '1px solid #eee', 
            fontWeight: 600, 
            fontSize: '0.9rem' 
          }}>
            <div>Transaction #</div>
            <div>Cashier Reason</div>
            <div>Cashier</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Date</div>
            <div>Actions</div>
          </div>
          {filteredRequests.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              {statusFilter === 'all' 
                ? 'No reversal requests found.' 
                : `No ${statusFilter} reversal requests found.`}
            </div>
          ) : (
            filteredRequests.map(request => (
              <div key={request.id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr 1fr', 
                padding: '1rem', 
                borderBottom: '1px solid #eee', 
                fontSize: '0.9rem', 
                alignItems: 'center' 
              }}>
                <div style={{ fontWeight: 500 }}>
                  🔄 {request.transaction_number}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {request.cashier_reason}
                </div>
                <div>{request.cashier_name}</div>
                <div style={{ fontWeight: 500 }}>
                  Rs.{parseFloat(request.total_amount).toFixed(2)}
                </div>
                <div style={{ color: getStatusColor(request.status), fontWeight: 600 }}>
                  {getStatusIcon(request.status)} {request.status}
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  {new Date(request.created_at).toLocaleDateString()}
                </div>
                <div>
                  {request.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => { 
                          setSelectedRequest(request); 
                          setActionType('approve'); 
                          setComment('');
                          setShowActionModal(true); 
                        }}
                        style={{ 
                          background: '#1ecb4f', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '4px', 
                          padding: '0.4rem 0.8rem', 
                          cursor: 'pointer', 
                          fontSize: '0.8rem', 
                          fontWeight: 500 
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => { 
                          setSelectedRequest(request); 
                          setActionType('reject'); 
                          setComment('');
                          setShowActionModal(true); 
                        }}
                        style={{ 
                          background: '#ff3b3b', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '4px', 
                          padding: '0.4rem 0.8rem', 
                          cursor: 'pointer', 
                          fontSize: '0.8rem', 
                          fontWeight: 500 
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ 
                      color: '#999', 
                      fontSize: '0.8rem',
                      fontStyle: 'italic' 
                    }}>
                      {request.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Modal */}
        {showActionModal && selectedRequest && (
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
                  {actionType === 'approve' ? '✅ Approve Reversal' : '❌ Reject Reversal'}
                </h3>
                <button
                  onClick={() => { setShowActionModal(false); setComment(''); }}
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
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '1rem', 
                  background: '#f8f9fa', 
                  borderRadius: '8px' 
                }}>
                  <div><strong>Transaction:</strong> {selectedRequest.transaction_number}</div>
                  <div><strong>Amount:</strong> Rs.{parseFloat(selectedRequest.total_amount).toFixed(2)}</div>
                  <div><strong>Cashier:</strong> {selectedRequest.cashier_name}</div>
                  <div><strong>Reason:</strong> {selectedRequest.cashier_reason}</div>
                  <div><strong>Requested:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</div>
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
                  style={{ 
                    background: actionType === 'approve' ? '#1ecb4f' : '#ff3b3b', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    padding: '0.8rem 1.5rem', 
                    cursor: 'pointer', 
                    fontWeight: 600, 
                    flex: 1 
                  }}
                >
                  {actionType === 'approve' ? 'Approve Reversal' : 'Reject Reversal'}
                </button>
                <button
                  onClick={() => { setShowActionModal(false); setComment(''); }}
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

        {showToast && (
          <Toast
            message={toastMsg}
            type={toastType}
            onClose={() => { setShowToast(false); setToastMsg(''); }}
            duration={5000}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
