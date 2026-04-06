import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [serverWaking, setServerWaking] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const wakeTimerRef = useRef(null);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e, overrideForm) => {
    if (e && e.preventDefault) e.preventDefault();
    const payload = overrideForm || form;
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      toast.error('Please enter a valid email address'); return;
    }
    if (!payload.password || payload.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    try {
      setLoading(true);
      // Show server wake-up notice after 3s
      wakeTimerRef.current = setTimeout(() => setServerWaking(true), 3000);
      const res = await loginAPI(payload);
      clearTimeout(wakeTimerRef.current);
      setServerWaking(false);
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'admin' || res.data.user.role === 'librarian' ? '/admin' : '/dashboard');
    } catch (err) {
      clearTimeout(wakeTimerRef.current);
      setServerWaking(false);
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-login: fill form AND auto-submit
  const handleQuickLogin = (email, password) => {
    const payload = { email, password };
    setForm(payload);
    handleSubmit(null, payload);
  };

  useEffect(() => () => clearTimeout(wakeTimerRef.current), []);

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
            <p>"A reader lives a thousand lives before he dies. The man who never reads lives only one."</p>
            <span>— George R.R. Martin</span>
          </div>
          <div className="auth__panel-deco">
            {['📚', '📖', '✍️', '📜'].map((e, i) => (
              <div key={i} className="auth__panel-icon" style={{ '--i': i }}>{e}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth__form-panel">
        <div className="auth__form-wrap page-enter">
          <div className="auth__header">
            <p className="auth__sub">Welcome back</p>
            <h1 className="auth__title">Sign In</h1>
            <p className="auth__desc">Access your library account to manage your books and membership.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth__form">
            <div className="auth__field">
              <label className="auth__label">Email Address</label>
              <input className="auth__input" type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="your@email.com" required autoComplete="email"/>
            </div>

            <div className="auth__field">
              <label className="auth__label">
                Password
                <Link to="/forgot-password" className="auth__forgot">Forgot password?</Link>
              </label>
              <div className="auth__input-wrap">
                <input className="auth__input" type={showPass ? 'text' : 'password'}
                  name="password" value={form.password} onChange={handleChange}
                  placeholder="••••••••" required autoComplete="current-password"/>
                <button type="button" className="auth__eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth__submit" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span className="auth__spinner" />
                  {serverWaking ? 'Waking up server…' : 'Signing in…'}
                </span>
              ) : 'Sign In →'}
            </button>

            {serverWaking && (
              <div className="auth__wake-banner">
                <span className="auth__wake-pulse" />
                <span>☕ Server is waking up on first visit — this can take up to 30s. Please wait…</span>
              </div>
            )}
          </form>



          <p className="auth__switch">
            Don't have an account?{' '}
            <Link to="/signup" className="auth__switch-link">Create Account →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}