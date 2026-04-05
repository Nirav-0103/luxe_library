import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPasswordAPI } from '../../api';
import './Auth.css';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match'); return;
    }
    try {
      setLoading(true);
      await resetPasswordAPI(token, { password: form.password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const strength = (p) => {
    if (!p) return { label: '', color: '', width: '0%' };
    if (p.length < 6) return { label: 'Too short', color: '#e05a5a', width: '20%' };
    if (p.length < 8) return { label: 'Weak', color: '#e05a5a', width: '35%' };
    const has = [/[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(p)).length;
    if (has === 0) return { label: 'Fair', color: '#c9a84c', width: '55%' };
    if (has === 1) return { label: 'Good', color: '#5a9ce0', width: '75%' };
    return { label: 'Strong', color: '#5acea0', width: '100%' };
  };
  const s = strength(form.password);

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
            <p>"Not all those who wander are lost."</p>
            <span>— J.R.R. Tolkien</span>
          </div>
        </div>
      </div>

      <div className="auth__form-panel">
        <div className="auth__form-wrap page-enter">
          {!done ? (
            <>
              <div className="auth__header">
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
                <p className="auth__sub">Set New Password</p>
                <h1 className="auth__title">Reset Password</h1>
                <p className="auth__desc">Choose a strong new password for your Luxe Library account.</p>
              </div>

              <form onSubmit={handleSubmit} className="auth__form">
                <div className="auth__field">
                  <label className="auth__label">New Password</label>
                  <div className="auth__input-wrap">
                    <input className="auth__input" type={showPass ? 'text' : 'password'}
                      value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min. 6 characters" required autoFocus/>
                    <button type="button" className="auth__eye" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 4, background: 'var(--bg-card3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: s.width, background: s.color, transition: 'all 0.3s', borderRadius: 2 }}/>
                      </div>
                      <span style={{ fontSize: 11, color: s.color, marginTop: 4, display: 'block' }}>{s.label}</span>
                    </div>
                  )}
                </div>

                <div className="auth__field">
                  <label className="auth__label">Confirm New Password</label>
                  <input className="auth__input" type="password"
                    value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Re-enter password" required/>
                  {form.confirm && form.password !== form.confirm && (
                    <span style={{ fontSize: 11, color: '#e05a5a', marginTop: 4, display: 'block' }}>Passwords do not match</span>
                  )}
                  {form.confirm && form.password === form.confirm && (
                    <span style={{ fontSize: 11, color: '#5acea0', marginTop: 4, display: 'block' }}>✓ Passwords match</span>
                  )}
                </div>

                <button type="submit" className="auth__submit" disabled={loading || form.password !== form.confirm}>
                  {loading ? <span className="auth__spinner" /> : '🔐 Reset Password'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 12 }}>
                Password Reset!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Your password has been reset successfully.<br/>
                Redirecting to login...
              </p>
              <Link to="/login" className="auth__submit" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Go to Login →
              </Link>
            </div>
          )}

          <p className="auth__switch" style={{ marginTop: 16 }}>
            <Link to="/login" className="auth__switch-link">← Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
