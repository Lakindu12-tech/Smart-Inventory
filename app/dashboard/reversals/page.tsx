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

interface Transaction {
  id: number;
  transaction_number: string;
  total_amount: string;
  date: string;
  payment_method: string;
}

interface ReversalRequest {
  id: number;
  transaction_id: number;
  transaction_number: string;
  total_amount: string;
  cashier_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  owner_comment?: string;
  created_at: string;
}

export default function ReversalsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reversalRequests, setReversalRequests] = useState<ReversalRequest[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [reason, setReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      if (userData.role !== 'cashier') {
        setToastMsg('Access denied. Cashiers only.');
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
    if (user && user.role === 'cashier') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch recent transactions
      const txnRes = await fetch('/api/sales?transactions=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const txnData = await txnRes.json();
      setTransactions(txnData.transactions || []);

      // Fetch reversal requests
      const revRes = await fetch('/api/reversal-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const revData = await revRes.json();
      setReversalRequests(Array.isArray(revData) ? revData : []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReversal = async () => {
    if (!selectedTransaction || !reason.trim()) {
      setToastMsg('Please provide a reason for reversal');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reversal-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          transaction_id: selectedTransaction.id,
          reason: reason
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToastMsg('Reversal request submitted successfully!');
        setToastType('success');
        setShowToast(true);
        setShowModal(false);
        setSelectedTransaction(null);
        setReason('');
        fetchData();
      } else {
        setToastMsg(data.message || 'Failed to submit request');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      setToastMsg('Error submitting reversal request');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSubmitting(false);
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

  if (!user) {
    return (
      <DashboardLayout userRole="user" userName="User">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</div>
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 2rem 0', color: '#333' }}>Bill Reversals</h1>

        {/* Recent Transactions */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: '#333' }}>Recent Transactions</h2>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
              padding: '1rem',
              background: '#f8f9fa',
              borderBottom: '1px solid #eee',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              <div>Transaction #</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Payment</div>
              <div>Action</div>
            </div>
            {transactions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No transactions found
              </div>
            ) : (
              transactions.map(txn => (
                <div key={txn.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                  padding: '1rem',
                  borderBottom: '1px solid #eee',
                  fontSize: '0.9rem',
                  alignItems: 'center'
                }}>
                  <div>{txn.transaction_number}</div>
                  <div>{new Date(txn.date).toLocaleString()}</div>
                  <div>Rs.{parseFloat(txn.total_amount).toFixed(2)}</div>
                  <div>{txn.payment_method}</div>
                  <div>
                    <button
                      onClick={() => { setSelectedTransaction(txn); setShowModal(true); }}
                      style={{
                        background: '#ff9500',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500
                      }}
                    >
                      Request Reversal
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reversal Requests History */}
        <div>
          <h2 style={{ marginBottom: '1rem', color: '#333' }}>My Reversal Requests</h2>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
              padding: '1rem',
              background: '#f8f9fa',
              borderBottom: '1px solid #eee',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              <div>Transaction #</div>
              <div>Amount</div>
              <div>Reason</div>
              <div>Status</div>
              <div>Date</div>
              <div>Owner Comment</div>
            </div>
            {reversalRequests.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No reversal requests yet
              </div>
            ) : (
              reversalRequests.map(req => (
                <div key={req.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                  padding: '1rem',
                  borderBottom: '1px solid #eee',
                  fontSize: '0.9rem'
                }}>
                  <div>{req.transaction_number}</div>
                  <div>Rs.{parseFloat(req.total_amount).toFixed(2)}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{req.cashier_reason}</div>
                  <div style={{ color: getStatusColor(req.status), fontWeight: 600 }}>
                    {req.status}
                  </div>
                  <div>{new Date(req.created_at).toLocaleString()}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {req.owner_comment || '-'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal for requesting reversal */}
        {showModal && selectedTransaction && (
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
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>
                Request Bill Reversal
              </h3>
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <div><strong>Transaction #:</strong> {selectedTransaction.transaction_number}</div>
                <div><strong>Amount:</strong> Rs.{parseFloat(selectedTransaction.total_amount).toFixed(2)}</div>
                <div><strong>Date:</strong> {new Date(selectedTransaction.date).toLocaleString()}</div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Reason for Reversal (Required)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '1.5px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter the reason for requesting bill reversal..."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleRequestReversal}
                  disabled={submitting || !reason.trim()}
                  style={{
                    background: '#ff9500',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.8rem 1.5rem',
                    cursor: submitting || !reason.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    flex: 1,
                    opacity: submitting || !reason.trim() ? 0.5 : 1
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  onClick={() => { setShowModal(false); setReason(''); setSelectedTransaction(null); }}
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
