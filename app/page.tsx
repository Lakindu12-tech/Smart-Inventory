"use client";
import { useState } from "react";
import Toast from "./components/Toast";
import Image from "next/image";

export default function LoginPage() {
  const [step, setStep] = useState<'username' | 'password'>('username');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username/email");
      setShowToast(true);
      return;
    }
    setError("");
    setStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });
      let data = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch (e) {
        console.error('Error parsing login response:', e);
      }
  if (!res.ok) throw new Error((data as any).message || "Login failed");
      // Store token and redirect to dashboard
  localStorage.setItem('token', (data as any).token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="centered" style={{ minHeight: '100vh' }}>
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        boxShadow: '0 4px 32px #1ecb4f22',
        padding: '2.5rem 2rem',
        minWidth: 320,
        maxWidth: 350,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Image src="/logo192.png" alt="SD Bandara Trading Logo" width={64} height={64} style={{ marginBottom: 12 }} />
        <h2 style={{ margin: 0, color: 'var(--primary-green)', fontWeight: 800, fontSize: 26, letterSpacing: 1 }}>
          SD Bandara Trading
        </h2>
        <div style={{ color: '#888', fontSize: 15, marginBottom: 24, marginTop: 2 }}>Smart Inventory & Billing System</div>
        {step === 'username' && (
          <form onSubmit={handleUsername} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <label htmlFor="username" style={{ alignSelf: 'flex-start' }}>👤 Username or Email</label>
            <input
              id="username"
              type="text"
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              style={{ width: '100%', maxWidth: 260, margin: 0, display: 'block' }}
              autoComplete="username"
            />
            {/* ...existing code... */}
            <button type="submit" style={{ width: '100%', maxWidth: 260, marginTop: 8 }}>
              Next &rarr;
            </button>
          </form>
        )}
        {step === 'password' && (
          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <label htmlFor="password" style={{ alignSelf: 'flex-start' }}>🔒 Password</label>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 260, gap: 8 }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ flex: 1, width: '100%', margin: 0, display: 'block' }}
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(p => !p)}
                style={{
                  background: '#f8f9fa',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: 8,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {/* ...existing code... */}
            <button type="submit" style={{ width: '100%', maxWidth: 260, marginTop: 8 }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button type="button" style={{ width: '100%', maxWidth: 260, marginTop: 10, background: 'var(--danger-red)' }} onClick={() => { setStep('username'); setPassword(''); setError(''); setShowToast(false); }}>
              &larr; Back
            </button>
          </form>
        )}
      </div>
      <div style={{ marginTop: 32, color: '#aaa', fontSize: 13 }}>
        &copy; {new Date().getFullYear()} SD Bandara Trading
      </div>
    {/* Toast notification for errors */}
    <Toast
      message={error}
      type="error"
      onClose={() => setShowToast(false)}
      duration={3000}
    />
    </div>
  );
} 