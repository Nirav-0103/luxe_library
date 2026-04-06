import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { subscribeNewsletterAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      const res = await subscribeNewsletterAPI({ email });
      toast.success(res.data.message || 'Subscribed successfully!');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer__glow" />
      <div className="container">

        {/* Newsletter Banner */}
        <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border-color2)', borderRadius: 16, padding: '40px 30px', marginBottom: 60, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, marginBottom: 8, color: 'var(--gold)' }}>Subscribe to Our Newsletter</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Get the latest updates on new arrivals, author events, and library news directly to your inbox.</p>
          </div>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8, flex: '1 1 300px' }}>
            <input type="email" placeholder="Enter your email address..." value={email} onChange={e => setEmail(e.target.value)} required style={{ flex: 1, padding: '12px 20px', borderRadius: 40, border: '1px solid var(--border-color2)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontSize: 14 }} />
            <button type="submit" disabled={loading} style={{ padding: '12px 28px', borderRadius: 40, background: 'var(--gold)', color: '#000', border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.05em' }}>
              {loading ? 'Wait...' : 'Subscribe'}
            </button>
          </form>
        </div>

        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-icon">✦</span>
              <span>LUXE LIBRARY</span>
            </div>
            <p className="footer__tagline">
              Where knowledge meets elegance. A curated collection for the discerning mind.
            </p>
            <div className="footer__divider" />
            <p className="footer__copy">© {new Date().getFullYear()} Luxe Library. All rights reserved.</p>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Navigate</h4>
            <ul className="footer__links">
              <li><Link to="/">Home</Link></li>
              <li><a href="/#collection">Collection</a></li>
              <li><a href="/#about">About Us</a></li>
              <li><a href="/#contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Account</h4>
            <ul className="footer__links">
              {!user && <li><Link to="/login">Sign In</Link></li>}
              {!user && <li><Link to="/signup">Register</Link></li>}
              {user && <li><Link to="/dashboard">My Dashboard</Link></li>}
              {user?.role === 'admin' && <li><Link to="/admin">Admin Panel</Link></li>}
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Visit Us</h4>
            <ul className="footer__address">
              <li>📍 123 Knowledge Street</li>
              <li>Ahmedabad, Gujarat 380001</li>
              <li>📞 +91 98765 43210</li>
              <li>✉️ info@luxelibrary.in</li>
              <li style={{ marginTop: 12 }}>🕐 Mon–Sat: 9AM – 8PM</li>
              <li>🕐 Sunday: 10AM – 5PM</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
