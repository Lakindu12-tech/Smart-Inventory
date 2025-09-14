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
  current_stock: number;
  category: string;
}

interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  performed_by_name: string;
  approved_by_name?: string;
  created_at: string;
}

export default function StockPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'in',
    quantity: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [addProductForm, setAddProductForm] = useState({
    name: '',
    category: 'Vegetables'
  });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'recent'>('stock');
  const [addRequests, setAddRequests] = useState<any[]>([]);
  const router = useRouter();

  // Filters for Recent Stock Movements
  const [movementSearch, setMovementSearch] = useState('');
  const [movementType, setMovementType] = useState('all');
  const [movementStatus, setMovementStatus] = useState('all');
  const [movementDate, setMovementDate] = useState('');
  // Filters for Recently Added Products
  const [recentSearch, setRecentSearch] = useState('');
  const [recentStatus, setRecentStatus] = useState('all');
  const [recentDate, setRecentDate] = useState('');

  // Handle URL parameters for automatic filtering
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filter = urlParams.get('filter');
      
      if (filter) {
        switch (filter) {
          case 'out-of-stock':
            setStockStatus('out');
            break;
          case 'low-stock':
            setStockStatus('low');
            break;
          case 'in-stock':
            setStockStatus('in');
            break;
          case 'all':
            setStockStatus('all');
            break;
        }
      }
    }
  }, []);

  // Global error handler for JSON parsing
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🔍 Unhandled promise rejection:', event.reason);
      if (event.reason && event.reason.message && event.reason.message.includes('JSON')) {
        console.error('🔍 JSON parsing error detected:', event.reason);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

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
      const response = await fetch('/api/stock?movements=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = {};
      try {
        const text = await response.text();
        if (text) data = JSON.parse(text);
      } catch (e) {
        console.error('Error parsing response:', e);
      }
      setProducts(Array.isArray(data.products) ? data.products : []);
      setMovements(Array.isArray(data.movements) ? data.movements : []);

      // Fetch add product requests (type 'add')
      const reqRes = await fetch('/api/product-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let reqData = [];
      try {
        const reqText = await reqRes.text();
        if (reqText) reqData = JSON.parse(reqText);
      } catch (e) {
        console.error('Error parsing add requests:', e);
      }
      setAddRequests(Array.isArray(reqData) ? reqData.filter((r: any) => r.type === 'add').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10) : []);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: parseInt(formData.product_id),
          movement_type: formData.movement_type,
          quantity: parseInt(formData.quantity),
          reason: formData.reason
        })
      });

      let data = {};
      try {
        const text = await response.text();
        if (text) data = JSON.parse(text);
      } catch (e) {
        console.error('Error parsing error response:', e);
      }

      if (response.ok) {
        alert('Stock movement request submitted successfully!');
        setShowMovementForm(false);
        setFormData({
          product_id: '',
          movement_type: 'in',
          quantity: '',
          reason: ''
        });
        fetchData(); // Refresh data
      } else {
        let errorMsg = 'Unknown error';
        if (data && data.message) errorMsg = data.message;
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      alert('Error submitting stock movement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (movementId: number) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Approving movement:', movementId);
      
      const response = await fetch(`/api/stock/${movementId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        alert('Stock movement approved successfully!');
        fetchData(); // Refresh data
      } else {
        let errorMsg = 'Unknown error';
        try {
          const text = await response.text();
          console.log('🔍 Error response text:', text);
          errorMsg = text;
          if (text) {
            const json = JSON.parse(text);
            errorMsg = json.message || JSON.stringify(json);
          }
        } catch (e) {
          console.error('🔍 Error parsing error response:', e);
        }
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('🔍 Error in handleApprove:', error);
      alert('Error approving stock movement');
    }
  };

  const handleReject = async (movementId: number) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Rejecting movement:', movementId);
      const response = await fetch(`/api/stock/${movementId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Stock movement rejected successfully!');
        fetchData(); // Refresh data
      } else {
        let errorMsg = 'Unknown error';
        try {
          const text = await response.text();
          console.log('🔍 Error response text:', text);
          errorMsg = text;
          if (text) {
            const json = JSON.parse(text);
            errorMsg = json.message || JSON.stringify(json);
          }
        } catch (e) {
          console.error('🔍 Error parsing error response:', e);
        }
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('🔍 Error in handleReject:', error);
      alert('Error rejecting stock movement');
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

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return '📥';
      case 'out': return '📤';
      case 'adjustment': return '🔄';
      default: return '❓';
    }
  };

  const getStockColor = (stock: number) => {
    if (stock <= 0) return '#ff3b3b';
    if (stock <= 10) return '#ff9500';
    return '#1ecb4f';
  };

  // Add a logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Add new product handler
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Prevent duplicate product names
      const exists = products.some(
        p => p.name.trim().toLowerCase() === addProductForm.name.trim().toLowerCase()
      );
      if (exists) {
        alert('A product with this name already exists. Please choose a different name.');
        setSubmitting(false);
        return;
      }
      const token = localStorage.getItem('token');
      // Submit as a product request of type 'add'
      const response = await fetch('/api/product-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'add',
          product_name: addProductForm.name,
          category: addProductForm.category
        })
      });
      if (response.ok) {
        alert('Add product request submitted successfully!');
        setShowAddProductForm(false);
        setAddProductForm({ name: '', category: 'Vegetables' });
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
      alert('Error submitting add product request');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered products
  const filteredProducts = products.filter(product => {
    const matchesName = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    let status = 'in';
    if (product.current_stock <= 0) status = 'out';
    else if (product.current_stock <= 10) status = 'low';
    const matchesStatus = stockStatus === 'all' ||
      (stockStatus === 'out' && status === 'out') ||
      (stockStatus === 'low' && status === 'low') ||
      (stockStatus === 'in' && status === 'in');
    return matchesName && matchesCategory && matchesStatus;
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Recently added products (last 10 by id/created_at desc)
  const recentlyAddedProducts = [...products]
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 10);

  // Filtered movements
  const filteredMovements = movements.filter(m => {
    const matchesName = !movementSearch || (m.product_name && m.product_name.toLowerCase().includes(movementSearch.toLowerCase()));
    const matchesType = movementType === 'all' || m.movement_type === movementType;
    const matchesStatus = movementStatus === 'all' || m.status === movementStatus;
    const matchesDate = !movementDate || (m.created_at && m.created_at.slice(0, 10) === movementDate);
    return matchesName && matchesType && matchesStatus && matchesDate;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  // Filtered add requests
  const filteredAddRequests = addRequests.filter(r => {
    const matchesName = !recentSearch || (r.product_name && r.product_name.toLowerCase().includes(recentSearch.toLowerCase()));
    const matchesStatus = recentStatus === 'all' || r.status === recentStatus;
    const matchesDate = !recentDate || (r.created_at && r.created_at.slice(0, 10) === recentDate);
    return matchesName && matchesStatus && matchesDate;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading || !user) {
    return (
      <DashboardLayout userRole={user?.role || 'user'} userName={user?.name || 'User'}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Owner Stock Management Interface
  if (user.role === 'owner') {
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
            <h1 style={{ margin: 0, color: '#333' }}>Stock Management - Owner Dashboard</h1>
          </div>

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
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                minWidth: 140,
                padding: '0.7rem 1rem',
                border: '1.5px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                background: '#fff'
              }}
            >
              <option value="all">All Categories</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={stockStatus}
              onChange={e => setStockStatus(e.target.value)}
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
              <option value="out">Out of Stock</option>
              <option value="low">Low Stock</option>
              <option value="in">In Stock</option>
            </select>
          </div>

          {/* Stock Levels Dashboard */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: '#333' }}>Current Stock Levels</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {filteredProducts.map(product => (
                <div key={product.id} style={{
                  background: '#fff',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `2px solid ${getStockColor(product.current_stock)}`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{ margin: 0, color: '#333' }}>{product.name}</h3>
                    <span style={{
                      color: getStockColor(product.current_stock),
                      fontWeight: 600,
                      fontSize: '1.2rem'
                    }}>
                      {product.current_stock}
                    </span>
                  </div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    Price: Rs.{product.price} | <strong>Category: {product.category}</strong>
                  </div>
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    background: getStockColor(product.current_stock) === '#ff3b3b' ? '#ffebee' :
                               getStockColor(product.current_stock) === '#ff9500' ? '#fff3e0' : '#e8f5e8',
                    color: getStockColor(product.current_stock)
                  }}>
                    {product.current_stock <= 0 ? 'Out of Stock' :
                     product.current_stock <= 10 ? 'Low Stock' : 'In Stock'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Role-based access control
  if (user.role === 'cashier') {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h1 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '2rem' }}>Access Denied</h1>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Cashiers do not have access to stock management. Please contact your administrator.
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

  // Storekeeper Stock Management Interface
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
          <h1 style={{ margin: 0, color: '#333' }}>Stock Management</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowAddProductForm(true)}
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
              ➕ Add New Product
            </button>
            <button
              onClick={() => setShowMovementForm(true)}
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
              📦 Submit Stock Movement
            </button>
          </div>
        </div>

        {/* Tabbed Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('stock')}
              style={{
                background: activeTab === 'stock' ? '#007aff' : '#f8f9fa',
                color: activeTab === 'stock' ? '#fff' : '#333',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                padding: '0.8rem 1.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'stock' ? '0 2px 8px #007aff22' : 'none',
                borderBottom: activeTab === 'stock' ? '2px solid #007aff' : '2px solid #eee',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              Current Stock Levels
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              style={{
                background: activeTab === 'movements' ? '#007aff' : '#f8f9fa',
                color: activeTab === 'movements' ? '#fff' : '#333',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                padding: '0.8rem 1.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'movements' ? '0 2px 8px #007aff22' : 'none',
                borderBottom: activeTab === 'movements' ? '2px solid #007aff' : '2px solid #eee',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              Recent Stock Movements
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              style={{
                background: activeTab === 'recent' ? '#007aff' : '#f8f9fa',
                color: activeTab === 'recent' ? '#fff' : '#333',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                padding: '0.8rem 1.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'recent' ? '0 2px 8px #007aff22' : 'none',
                borderBottom: activeTab === 'recent' ? '2px solid #007aff' : '2px solid #eee',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              Recently Added Products
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'stock' && (
            <div>
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
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  style={{
                    minWidth: 140,
                    padding: '0.7rem 1rem',
                    border: '1.5px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: '#fff'
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={stockStatus}
                  onChange={e => setStockStatus(e.target.value)}
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
                  <option value="out">Out of Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="in">In Stock</option>
                </select>
              </div>
              {/* Stock Levels Dashboard */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {filteredProducts.map(product => (
                  <div key={product.id} style={{
                    background: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: `2px solid ${getStockColor(product.current_stock)}`
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{ margin: 0, color: '#333' }}>{product.name}</h3>
                      <span style={{
                        color: getStockColor(product.current_stock),
                        fontWeight: 600,
                        fontSize: '1.2rem'
                      }}>
                        {product.current_stock}
                      </span>
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      Price: Rs.{product.price} | <strong>Category: {product.category}</strong>
                    </div>
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      background: getStockColor(product.current_stock) === '#ff3b3b' ? '#ffebee' :
                                 getStockColor(product.current_stock) === '#ff9500' ? '#fff3e0' : '#e8f5e8',
                      color: getStockColor(product.current_stock)
                    }}>
                      {product.current_stock <= 0 ? 'Out of Stock' :
                       product.current_stock <= 10 ? 'Low Stock' : 'In Stock'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'movements' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>Recent Stock Movements</h2>
              </div>
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
                  value={movementSearch}
                  onChange={e => setMovementSearch(e.target.value)}
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
                  value={movementType}
                  onChange={e => setMovementType(e.target.value)}
                  style={{
                    minWidth: 120,
                    padding: '0.7rem 1rem',
                    border: '1.5px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: '#fff'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="adjustment">Adjustment</option>
                </select>
                <select
                  value={movementStatus}
                  onChange={e => setMovementStatus(e.target.value)}
                  style={{
                    minWidth: 120,
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
                  value={movementDate}
                  onChange={e => setMovementDate(e.target.value)}
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
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderBottom: '1px solid #eee',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}>
                  <div>Product</div>
                  <div>Type</div>
                  <div>Quantity</div>
                  <div>Status</div>
                  <div>Date</div>
                  <div>Reason</div>
                </div>
                {filteredMovements.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    No stock movements found.
                  </div>
                ) : (
                  filteredMovements.map(movement => (
                    <div key={movement.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                      padding: '1rem',
                      borderBottom: '1px solid #eee',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ fontWeight: 500 }}>{movement.product_name}</div>
                      <div>
                        {getMovementIcon(movement.movement_type)} {movement.movement_type}
                      </div>
                      <div style={{ 
                        color: movement.movement_type === 'in' ? '#1ecb4f' : '#ff3b3b',
                        fontWeight: 600
                      }}>
                        {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                      </div>
                      <div style={{ 
                        color: getStatusColor(movement.status),
                        fontWeight: 600
                      }}>
                        {getStatusIcon(movement.status)} {movement.status}
                      </div>
                      <div>
                        {new Date(movement.created_at).toISOString().slice(0, 10)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {movement.reason || '-'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>Recently Added Products</h2>
              </div>
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
                  value={recentSearch}
                  onChange={e => setRecentSearch(e.target.value)}
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
                  value={recentStatus}
                  onChange={e => setRecentStatus(e.target.value)}
                  style={{
                    minWidth: 120,
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
                  value={recentDate}
                  onChange={e => setRecentDate(e.target.value)}
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
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderBottom: '1px solid #eee',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}>
                  <div>Product Name</div>
                  <div>Product Type</div>
                  <div>Status</div>
                  <div>Date</div>
                </div>
                {filteredAddRequests.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    No recently added products found.
                  </div>
                ) : (
                  filteredAddRequests.map(request => (
                    <div key={request.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      padding: '1rem',
                      borderBottom: '1px solid #eee',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ fontWeight: 500 }}>{request.product_name}</div>
                      <div>{request.category}</div>
                      <div style={{ fontWeight: 600, color: request.status === 'approved' ? '#1ecb4f' : request.status === 'pending' ? '#ff9500' : '#ff3b3b' }}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </div>
                      <div>{request.created_at ? new Date(request.created_at).toISOString().slice(0, 10) : '-'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Movement Form Modal */}
        {showMovementForm && (
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
                <h3 style={{ margin: 0, color: '#333' }}>Submit Stock Movement</h3>
                <button
                  onClick={() => setShowMovementForm(false)}
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
                    Product *
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
                        {product.name} (Current: {product.current_stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Movement Type *
                  </label>
                  <select
                    value={formData.movement_type}
                    onChange={(e) => setFormData({...formData, movement_type: e.target.value as any})}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    required
                  >
                    <option value="in">📥 Stock In</option>
                    <option value="out">📤 Stock Out</option>
                    <option value="adjustment">🔄 Stock Adjustment</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter quantity"
                    min="1"
                    required
                  />
                </div>

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
                    placeholder="Enter reason for this movement"
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
                    {submitting ? 'Submitting...' : 'Submit Movement'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMovementForm(false)}
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

        {/* Add Product Form Modal */}
        {showAddProductForm && (
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
                <h3 style={{ margin: 0, color: '#333' }}>Add New Product</h3>
                <button
                  onClick={() => setShowAddProductForm(false)}
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
              <form onSubmit={handleAddProduct}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={addProductForm.name}
                    onChange={e => setAddProductForm({ ...addProductForm, name: e.target.value })}
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
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Category *
                  </label>
                  <select
                    value={addProductForm.category}
                    onChange={e => setAddProductForm({ ...addProductForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    required
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Other">Other</option>
                  </select>
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
                    {submitting ? 'Submitting...' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProductForm(false)}
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
      </div>
    </DashboardLayout>
  );
} 