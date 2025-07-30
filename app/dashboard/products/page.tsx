"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';

interface User {
  id: number;
  name: string;
  role: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  category: string;
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
  requester_name: string;
}

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'add',
    product_name: '',
    product_id: '',
    requested_price: '',
    requested_quantity: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPriceChangeForm, setShowPriceChangeForm] = useState(false);
  const [priceChangeForm, setPriceChangeForm] = useState({
    product_id: '',
    requested_price: ''
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
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
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
      return;
    }
    
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [productsRes, requestsRes] = await Promise.all([
        fetch('/api/products', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/product-requests', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      let productsData = [];
      let requestsData = [];
      
      try {
        const productsText = await productsRes.text();
        if (productsText) productsData = JSON.parse(productsText);
      } catch (e) {
        console.error('Error parsing products response:', e);
      }
      
      try {
        const requestsText = await requestsRes.text();
        if (requestsText) requestsData = JSON.parse(requestsText);
      } catch (e) {
        console.error('Error parsing requests response:', e);
      }

      setProducts(Array.isArray(productsData) ? productsData : []);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prevent duplicate product add requests for existing products
      if (formData.type === 'add') {
        const exists = products.some(
          p => p.name.trim().toLowerCase() === formData.product_name.trim().toLowerCase()
        );
        if (exists) {
          alert('A product with this name already exists. Please choose a different name.');
          setSubmitting(false);
          return;
        }
      }
      const token = localStorage.getItem('token');
      const response = await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: formData.type,
          product_name: formData.product_name,
          product_id: formData.product_id ? parseInt(formData.product_id) : null,
          requested_price: formData.requested_price ? parseFloat(formData.requested_price) : null,
          requested_quantity: formData.requested_quantity ? parseInt(formData.requested_quantity) : null,
          reason: formData.reason
        })
      });

      if (response.ok) {
        alert('Product request submitted successfully!');
        setShowRequestForm(false);
        setFormData({
          type: 'add',
          product_name: '',
          product_id: '',
          requested_price: '',
          requested_quantity: '',
          reason: ''
        });
        fetchData();
      } else {
        let errorMsg = 'Unknown error';
        try {
          const text = await response.text();
          if (text) {
            const json = JSON.parse(text);
            errorMsg = json.message || JSON.stringify(json);
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      alert('Error submitting product request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    if (!user || user.role !== 'owner') return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/product-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ owner_comment: 'Approved' })
      });

      if (response.ok) {
        alert('Request approved successfully!');
        fetchData();
      } else {
        let errorMsg = 'Unknown error';
        try {
          const text = await response.text();
          if (text) {
            const json = JSON.parse(text);
            errorMsg = json.message || JSON.stringify(json);
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        alert(`Error approving request: ${errorMsg}`);
      }
    } catch (error) {
      alert('Error approving request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!user || user.role !== 'owner') return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/product-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ owner_comment: 'Rejected' })
      });

      if (response.ok) {
        alert('Request rejected successfully!');
        fetchData();
      } else {
        let errorMsg = 'Unknown error';
        try {
          const text = await response.text();
          if (text) {
            const json = JSON.parse(text);
            errorMsg = json.message || JSON.stringify(json);
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        alert(`Error rejecting request: ${errorMsg}`);
      }
    } catch (error) {
      alert('Error rejecting request');
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

  // Add a logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Price change handler
  const handlePriceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'price',
          product_id: priceChangeForm.product_id ? parseInt(priceChangeForm.product_id) : null,
          requested_price: priceChangeForm.requested_price ? parseFloat(priceChangeForm.requested_price) : null
        })
      });
      if (response.ok) {
        alert('Price change request submitted successfully!');
        setShowPriceChangeForm(false);
        setPriceChangeForm({ product_id: '', requested_price: '' });
        fetchData();
      } else {
        let errorMsg = 'Unknown error';
        try {
          const text = await response.text();
          if (text) {
            const json = JSON.parse(text);
            errorMsg = json.message || JSON.stringify(json);
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      alert('Error submitting price change request');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered price change requests for storekeeper
  const filteredPriceRequests = requests.filter(r => r.type === 'price')
    .filter(r => {
      const product = products.find(p => p.id === r.product_id);
      const matchesName = !search || (product && product.name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesDate = !dateFilter || (r.created_at && r.created_at.slice(0, 10) === dateFilter);
      return matchesName && matchesStatus && matchesDate;
    });

  if (loading || !user) {
    return (
      <DashboardLayout userRole={user?.role || 'user'} userName={user?.name || 'User'}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role === 'owner') {
    // Remove owner view entirely
    return null;
  }

  // Role-based access control - Cashiers can only view products, not submit requests
  if (user.role === 'cashier') {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem' 
          }}>
            <h1 style={{ margin: 0, color: '#333' }}>Product Catalog</h1>
            {/* Add a logout button in the products UI, e.g. in the header or sidebar */}
            <button onClick={handleLogout} style={{
              background: '#ff3b3b',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.8rem 1.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              Logout
            </button>
          </div>

          {/* Products Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {products.map(product => (
              <div key={product.id} style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid #007aff20'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{ margin: 0, color: '#333' }}>{product.name}</h3>
                  <span style={{
                    color: '#007aff',
                    fontWeight: 600,
                    fontSize: '1.2rem'
                  }}>
                    Rs.{product.price}
                  </span>
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                  Category: {product.category}
                </div>
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  background: product.stock <= 0 ? '#ffebee' : 
                             product.stock <= 10 ? '#fff3e0' : '#e8f5e8',
                  color: product.stock <= 0 ? '#ff3b3b' : 
                         product.stock <= 10 ? '#ff9500' : '#1ecb4f'
                }}>
                  Stock: {product.stock} {product.stock <= 0 ? '(Out of Stock)' : 
                                         product.stock <= 10 ? '(Low Stock)' : '(In Stock)'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role === 'storekeeper') {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem' 
          }}>
            <h1 style={{ margin: 0, color: '#333' }}>Price Management</h1>
            <button
              onClick={() => setShowPriceChangeForm(true)}
              style={{
                background: '#007aff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.8rem 1.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              💲 Submit Price Change
            </button>
          </div>

          {/* Price Change Form Modal */}
          {showPriceChangeForm && (
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
                  <h3 style={{ margin: 0, color: '#333' }}>Submit Price Change</h3>
                  <button
                    onClick={() => setShowPriceChangeForm(false)}
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
                <form onSubmit={handlePriceChange}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Select Product *
                    </label>
                    <select
                      value={priceChangeForm.product_id}
                      onChange={e => setPriceChangeForm({ ...priceChangeForm, product_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        border: '1.5px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - Rs.{product.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      New Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceChangeForm.requested_price}
                      onChange={e => setPriceChangeForm({ ...priceChangeForm, requested_price: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        border: '1.5px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter new price"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        background: '#007aff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.8rem 1.5rem',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        flex: 1,
                        opacity: submitting ? 0.7 : 1
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Price Change'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPriceChangeForm(false)}
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
            </div>
          )}

          {/* Request History */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: '#333' }}>
              My Price Change Requests
            </h2>
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
                placeholder="Search by product name..."
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
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  minWidth: 140,
                  padding: '0.7rem 1rem',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: '#fff'
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                style={{
                  minWidth: 140,
                  padding: '0.7rem 1rem',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
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
                <div>Product</div>
                <div>Requested Price</div>
                <div>Status</div>
                <div>Date</div>
                <div>Owner Comment</div>
              </div>
              {filteredPriceRequests.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  No price change requests found.
                </div>
              ) : (
                filteredPriceRequests.map(request => (
                  <div key={request.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                    padding: '1rem',
                    borderBottom: '1px solid #eee',
                    fontSize: '0.9rem'
                  }}>
                    <div>{products.find(p => p.id === request.product_id)?.name || '-'}</div>
                    <div>Rs.{request.requested_price}</div>
                    <div style={{ color: getStatusColor(request.status), fontWeight: 600 }}>
                      {getStatusIcon(request.status)} {request.status}
                    </div>
                    <div>{new Date(request.created_at).toISOString().slice(0, 10)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{request.owner_comment || '-'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user.role} userName={user.name}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <h1 style={{ margin: 0, color: '#333' }}>Product Management</h1>
          {/* Only show submit request button to storekeepers */}
          {user.role === 'storekeeper' && (
            <button
              onClick={() => setShowRequestForm(true)}
              style={{
                background: '#1ecb4f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.8rem 1.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              📝 Submit New Request
            </button>
          )}
          {/* Show pending requests count for owners */}
          {user.role === 'owner' && (
            <div style={{
              background: '#ff9500',
              color: '#fff',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              ⏳ {requests.filter(r => r.status === 'pending').length} Pending Requests
            </div>
          )}
          {/* Removed logout button from here */}
        </div>

        {/* Request Form Modal */}
        {showRequestForm && (
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
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ margin: 0, color: '#333' }}>Submit Product Request</h3>
                <button
                  onClick={() => setShowRequestForm(false)}
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

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Request Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="add">Add New Product</option>
                    <option value="price">Change Price</option>
                    <option value="stock">Change Stock</option>
                  </select>
                </div>

                {formData.type === 'add' ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.product_name}
                      onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        border: '1.5px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Select Product *
                    </label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        border: '1.5px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - Rs.{product.price}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(formData.type === 'add' || formData.type === 'price') && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      {formData.type === 'add' ? 'Price (Rs.) *' : 'New Price (Rs.) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.requested_price}
                      onChange={(e) => setFormData({...formData, requested_price: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        border: '1.5px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter price"
                      required
                    />
                  </div>
                )}

                {formData.type === 'stock' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Quantity Change *
                    </label>
                    <input
                      type="number"
                      value={formData.requested_quantity}
                      onChange={(e) => setFormData({...formData, requested_quantity: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        border: '1.5px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter quantity (positive for add, negative for remove)"
                      required
                    />
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Reason (Optional)
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter reason for this request"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: '#1ecb4f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.8rem 1.5rem',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      flex: 1,
                      opacity: submitting ? 0.7 : 1
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
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
          </div>
        )}

        {/* Request History */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: '#333' }}>
            {user.role === 'owner' ? 'All Requests' : 'My Request History'}
          </h2>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: user.role === 'owner' ? '1fr 1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr 1fr',
              padding: '1rem',
              background: '#f8f9fa',
              borderBottom: '1px solid #eee',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              <div>Type</div>
              <div>Details</div>
              <div>Requester</div>
              {user.role === 'owner' && <div>Actions</div>}
              <div>Status</div>
              <div>Date</div>
              {user.role === 'owner' && <div>Owner Comment</div>}
            </div>
            {requests.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No requests found.
              </div>
            ) : (
              Array.isArray(requests) && requests.map(request => (
                <div key={request.id} style={{
                  display: 'grid',
                  gridTemplateColumns: user.role === 'owner' ? '1fr 1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr 1fr',
                  padding: '1rem',
                  borderBottom: '1px solid #eee',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ fontWeight: 500 }}>
                    {request.type === 'add' ? '➕ Add' : 
                     request.type === 'price' ? '💰 Price' : '📦 Stock'}
                  </div>
                  <div>
                    {request.type === 'add' ? request.product_name :
                     request.type === 'price' ? `Rs.${request.requested_price}` :
                     `${request.requested_quantity > 0 ? '+' : ''}${request.requested_quantity}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {request.requester_name}
                  </div>
                  {user.role === 'owner' && request.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        style={{
                          background: '#1ecb4f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        style={{
                          background: '#ff3b3b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {user.role === 'owner' && request.status !== 'pending' && (
                    <div>-</div>
                  )}
                  <div style={{ 
                    color: getStatusColor(request.status),
                    fontWeight: 600
                  }}>
                    {getStatusIcon(request.status)} {request.status}
                  </div>
                  <div>
                    {new Date(request.created_at).toISOString().slice(0, 10)}
                  </div>
                  {user.role === 'owner' && (
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {request.owner_comment || '-'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Product Catalog */}
        <div>
          <h2 style={{ marginBottom: '1rem', color: '#333' }}>Product Catalog</h2>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '1rem',
              background: '#f8f9fa',
              borderBottom: '1px solid #eee',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              <div>Product Name</div>
              <div>Price (Rs.)</div>
              <div>Stock</div>
              <div>Category</div>
            </div>
            {products.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                No products available.
              </div>
            ) : (
              Array.isArray(products) && products.map(product => (
                <div key={product.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '1rem',
                  borderBottom: '1px solid #eee',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ fontWeight: 500 }}>{product.name}</div>
                  <div>Rs.{product.price}</div>
                  <div style={{ 
                    color: product.stock > 0 ? '#1ecb4f' : '#ff3b3b',
                    fontWeight: 600
                  }}>
                    {product.stock}
                  </div>
                  <div>{product.category}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 