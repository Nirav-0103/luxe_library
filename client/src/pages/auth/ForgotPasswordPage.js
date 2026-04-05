import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPasswordAPI } from '../../api';
import './Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address'); return;
    }
    try {
      setLoading(true);
      await forgotPasswordAPI({ email });
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__panel-bg" />
        <div className="auth__panel-content">
          <Link to="/" className="auth__logo">
            <span className="auth__logo-star">✦</span>
            LUXE LIBRARY
          </Link>
          <div className="auth__panel-quote">
            <p>"Every secret of a writer's soul, every experience of his life, every quality of his mind, is written large in his works."</p>
            <span>— Virginia Woolf</span>
          </div>
        </div>
      </div>

      <div className="auth__form-panel">
        <div className="auth__form-wrap page-enter">
          {!sent ? (
            <>
              <div className="auth__header">
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
                <p className="auth__sub">Account Recovery</p>
                <h1 className="auth__title">Forgot Password?</h1>
                <p className="auth__desc">Enter your registered email address and we'll send you a link to reset your password.</p>
              </div>

              <form onSubmit={handleSubmit} className="auth__form">
                <div className="auth__field">
                  <label className="auth__label">Registered Email Address</label>
                  <input className="auth__input" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com" required autoFocus/>
                </div>
                <button type="submit" className="auth__submit" disabled={loading}>
                  {loading ? <span className="auth__spinner" /> : '📧 Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>📬</div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 12 }}>
                Check Your Email!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                We've sent a password reset link to<br/>
                <strong style={{ color: 'var(--gold)' }}>{email}</strong>
              </p>
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '16px 20px', marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, textAlign: 'left' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>What to do next:</strong>
                1. Open your email inbox<br/>
                2. Click the reset link in the email<br/>
                3. Choose a new password<br/>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8, display: 'block' }}>⏰ Link expires in 15 minutes. Check spam if not found.</span>
              </div>
              <button onClick={() => { setSent(false); setEmail(''); }}
                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '10px 20px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontFamily: 'Jost, sans-serif', marginBottom: 16 }}>
                Try different email
              </button>
            </div>
          )}

          <p className="auth__switch" style={{ marginTop: 16 }}>
            Remember your password?{' '}
            <Link to="/login" className="auth__switch-link">Sign In →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
