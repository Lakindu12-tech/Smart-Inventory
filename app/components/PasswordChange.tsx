"use client";
import { useState } from 'react';

interface PasswordChangeProps {
  onClose: () => void;
}

export default function PasswordChange({ onClose }: PasswordChangeProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      let data = {};
      try {
        const text = await response.text();
        if (text) data = JSON.parse(text);
      } catch (e) {
        console.error('Error parsing password change response:', e);
      }

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        onClose();
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
        maxWidth: '400px',
        width: '90%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>Change Password 🔐</h3>
          <button
            onClick={onClose}
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
              Current Password
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '1.5px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              placeholder="Enter current password"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              New Password
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '1.5px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              placeholder="Enter new password"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '1.5px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              placeholder="Confirm new password"
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#ff3b3b',
              color: '#fff',
              padding: '0.8rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#1ecb4f',
              color: '#fff',
              padding: '0.8rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              ✅ {success}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#1ecb4f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.8rem 1.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                flex: 1,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button
              type="button"
              onClick={onClose}
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

        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <strong>Password Requirements:</strong>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
            <li>Minimum 4 characters</li>
            <li>Cannot be the same as current password</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 