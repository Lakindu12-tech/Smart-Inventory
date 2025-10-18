import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        padding: '12px 24px',
        borderRadius: 8,
        background: type === 'error' ? '#ff4d4f' : type === 'success' ? '#52c41a' : '#1890ff',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontWeight: 500,
        minWidth: 200,
        maxWidth: 400,
        textAlign: 'center',
      }}
      role="alert"
    >
      {message}
      <button
        style={{
          marginLeft: 16,
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
