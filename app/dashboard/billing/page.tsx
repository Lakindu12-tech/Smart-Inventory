"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import ProductCustomizationModal from '../../components/ProductCustomizationModal';

interface Product {
  id: number;
  name: string;
  price: string;
  current_stock: number;
  category: string;
  image_filename?: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  stock: number;
  image_filename?: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

// Advanced Product Button Component with Images
const ProductButton = ({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (quantity > 0 && quantity <= product.current_stock) {
      onAdd({ ...product, qty: quantity });
      setShowModal(false);
      setQuantity(1);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={product.current_stock <= 0}
        style={{
          background: '#1ecb4f',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '16px',
          margin: '6px',
          cursor: product.current_stock > 0 ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 500,
          minWidth: '140px',
          minHeight: '120px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }}
      >
        {/* Product Image */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.3)'
        }}>
          {product.image_filename ? (
            <img
              src={`/images/products/${product.image_filename}`}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'flex';
              }}
            />
          ) : null}
          <div style={{
            display: product.image_filename ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '24px'
          }}>
            🥬
          </div>
        </div>

        {/* Product Info */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '4px',
          textAlign: 'center',
          width: '100%'
        }}>
          <span style={{ 
            fontWeight: 600, 
            fontSize: '13px',
            lineHeight: '1.2',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {product.name}
          </span>
          <span style={{ 
            fontSize: '12px',
            opacity: 0.9,
            fontWeight: 500
          }}>
            Rs.{Number(product.price).toFixed(2)}/kg
          </span>
          <span style={{ 
            fontSize: '11px', 
            opacity: 0.8,
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            Stock: {product.current_stock}kg
          </span>
        </div>

        {/* Stock Indicator */}
        {product.current_stock <= 0 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#ff3b3b',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600
          }}>
            OUT
          </div>
        )}
      </button>

      {showModal && (
        <div 
          style={{
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
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              minWidth: '300px',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
              Add {product.name}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Quantity (kg):
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={product.current_stock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Max: {product.current_stock}kg
              </small>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                             <button 
                 onClick={() => setShowModal(false)}
                 style={{
                   background: '#f0f0f0',
                   color: '#333',
                   border: 'none',
                   borderRadius: '6px',
                   padding: '8px 16px',
                   cursor: 'pointer'
                 }}
               >
                 Cancel
               </button>
              <button 
                onClick={handleAdd}
                style={{
                  background: '#1ecb4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Enhanced Cart Item Component with Images
const CartItem = ({ item, onUpdateQty, onRemove }: { 
  item: CartItem; 
  onUpdateQty: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) => {
  const total = item.price * item.qty;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      borderBottom: '1px solid #eee',
      gap: '16px',
      background: '#fafafa',
      borderRadius: '8px',
      marginBottom: '8px'
    }}>
      {/* Product Image */}
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '6px',
        overflow: 'hidden',
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {item.image_filename ? (
          <img
            src={`/images/products/${item.image_filename}`}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{
          display: item.image_filename ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '20px'
        }}>
          🥬
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>{item.name}</div>
        <div style={{ color: '#666', fontSize: '13px' }}>
          Rs.{item.price.toFixed(2)}/kg
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
            onClick={() => onUpdateQty(item.id, Math.max(0.1, item.qty - 0.1))}
            style={{
              background: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              width: '28px',
              height: '28px',
              cursor: 'pointer'
            }}
          >
            -
          </button>
        <input
          type="number"
          step="0.1"
          min="0.1"
          max={item.stock}
          value={item.qty}
          onChange={(e) => onUpdateQty(item.id, Number(e.target.value))}
          style={{
            width: '60px',
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            textAlign: 'center'
          }}
        />
        <span style={{ fontSize: '12px', color: '#666' }}>kg</span>
                  <button 
            onClick={() => onUpdateQty(item.id, Math.min(item.stock, item.qty + 0.1))}
            style={{
              background: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              width: '28px',
              height: '28px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        <div style={{ textAlign: 'right', minWidth: '80px' }}>
          <div style={{ fontWeight: 600 }}>Rs.{total.toFixed(2)}</div>
          <button 
            onClick={() => onRemove(item.id)}
            style={{
              background: '#ff3b3b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

// Clean Receipt Modal Component
const ReceiptModal = ({ 
  show, 
  onClose, 
  bill, 
  payment, 
  total, 
  transactionId 
}: {
  show: boolean;
  onClose: () => void;
  bill: CartItem[];
  payment: string;
  total: number;
  transactionId: string;
}) => {
  if (!show) return null;

  return (
    <div 
      style={{
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
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 4px 0', color: '#333' }}>SD Bandara Trading</h2>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Fresh Produce & Groceries
          </p>
        </div>
        
        <div style={{ marginBottom: '20px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Transaction ID:</span>
            <span>{transactionId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Date:</span>
            <span>{new Date().toISOString().replace('T', ' ').slice(0, 16)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment:</span>
            <span>{payment.toUpperCase()}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '12px 0', marginBottom: '20px' }}>
          {bill.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>{item.name} x{item.qty}kg</span>
              <span>Rs.{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '18px', marginBottom: '20px' }}>
          <span>Total:</span>
          <span>Rs.{total.toFixed(2)}</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 16px 0', color: '#666' }}>
            Thank you for your purchase!
          </p>
          <button 
            onClick={onClose}
            style={{
              background: '#1ecb4f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BillingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
      
      // Only cashiers and owners can access billing
      if (userData.role !== 'cashier' && userData.role !== 'owner') {
        alert('Access denied. Only cashiers and owners can access billing.');
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/');
      return;
    }

    // Fetch products
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const sortedProducts = [...list].sort((a, b) => a.name.localeCompare(b.name));
        setProducts(sortedProducts);
      })
      .catch(err => setError('Failed to load products'));
  }, [router]);

  // Add a logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(prev => prev.map(item => 
        item.id === product.id 
          ? { ...item, qty: Math.min(item.stock, item.qty + product.qty) }
          : item
      ));
    } else {
      setCart(prev => [...prev, {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        qty: product.qty,
        stock: product.current_stock,
        image_filename: product.image_filename
      }]);
    }
  };

  const updateQty = (id: number, qty: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, qty: Math.max(0.1, Math.min(item.stock, qty)) } : item
    ));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.qty,
            price: item.price
          })),
          payment_method: payment,
          discount: discount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Checkout failed');
      }

      setTransactionId(data.transaction_id || data.transactionId);
      setShowReceipt(true);
      setCart([]);
      setDiscount(0);
      
      // Refresh products to update stock
      fetch('/api/products')
        .then(r => r.json())
        .then(data => {
          const list = Array.isArray(data) ? data : [];
          const sortedProducts = [...list].sort((a, b) => a.name.localeCompare(b.name));
          setProducts(sortedProducts);
        });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const finalTotal = total - discount;

  const filteredProducts = products
    .filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleImageUpdate = (productId: number, imageFilename: string) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, image_filename: imageFilename }
        : product
    ));
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

  // Only cashiers and owners can access billing
  if (user.role !== 'cashier' && user.role !== 'owner') {
    return (
      <DashboardLayout userRole={user.role} userName={user.name}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h1 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '2rem' }}>Access Denied</h1>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Only cashiers and owners can access the billing system. Please contact your administrator.
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

  return (
    <DashboardLayout userRole={user.role} userName={user.name}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1ecb4f, #16a34a)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          position: 'relative'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
              💰 Advanced Billing System
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
              Create bills and process sales for SD Bandara Trading
            </p>
          </div>
          
          {/* Customization Button */}
          <button
            onClick={() => setShowCustomization(true)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🎨 Customize
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          {/* Products Section */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="🔍 Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: '#f8f9fa'
                }}
              />
            </div>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxHeight: '600px',
              overflow: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: 0, color: '#333' }}>
                  🛍️ Products ({filteredProducts.length})
                </h3>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  background: '#f0f0f0',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {filteredProducts.filter(p => p.image_filename).length} with images
                </div>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                gap: '12px',
                padding: '8px'
              }}>
                {Array.isArray(filteredProducts) && filteredProducts.map(product => (
                  <ProductButton key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            height: 'fit-content',
            position: 'sticky',
            top: '20px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>
                🛒 Bill ({cart.length} items)
              </h3>
              {cart.length > 0 && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  background: '#f0f0f0',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  Total: Rs.{finalTotal.toFixed(2)}
                </div>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                padding: '60px 20px',
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '12px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🛒</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '18px' }}>
                  Cart is Empty
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                  Select products from the left to start billing
                </p>
                <div style={{ 
                  marginTop: '16px',
                  fontSize: '12px',
                  color: '#adb5bd'
                }}>
                  💡 Tip: Use the 🎨 Customize button to add product images
                </div>
              </div>
            ) : (
              <>
                <div style={{ maxHeight: '300px', overflow: 'auto', marginBottom: '16px' }}>
                  {Array.isArray(cart) && cart.map(item => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQty={updateQty}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Subtotal:</span>
                    <span>Rs.{total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span>Discount:</span>
                    <input
                      type="number"
                      min="0"
                      max={total}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      style={{
                        width: '80px',
                        padding: '4px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        textAlign: 'right'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '18px', marginBottom: '16px' }}>
                    <span>Total:</span>
                    <span>Rs.{finalTotal.toFixed(2)}</span>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      Payment Method:
                    </label>
                    <select
                      value={payment}
                      onChange={(e) => setPayment(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="mobile">Mobile Payment</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading || cart.length === 0}
                    style={{
                      width: '100%',
                      background: loading || cart.length === 0 ? '#ccc' : '#1ecb4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '16px',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: loading || cart.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Processing...' : 'Complete Sale'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            background: '#ff3b3b',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            marginTop: '16px',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}

        <ReceiptModal
          show={showReceipt}
          onClose={() => setShowReceipt(false)}
          bill={cart}
          payment={payment}
          total={finalTotal}
          transactionId={transactionId}
        />

        <ProductCustomizationModal
          show={showCustomization}
          onClose={() => setShowCustomization(false)}
          products={products}
          onImageUpdate={handleImageUpdate}
        />
      </div>
    </DashboardLayout>
  );
} 