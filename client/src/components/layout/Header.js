import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { io } from 'socket.io-client';
import { getAdminOrdersAPI, getMyOrdersAPI } from '../../api';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (user?.role === 'admin') {
      // Admin: preload pending placed orders
      getAdminOrdersAPI({ status: 'placed' })
        .then(res => {
          const placed = res.data.data || [];
          if (placed.length > 0) {
            const seenIds = JSON.parse(localStorage.getItem('seen_notifs') || '[]');
            setNotifications(placed.map(o => ({
              id: o._id,
              text: `📦 Order ${o.orderNumber} — ${o.user?.name || 'Customer'} (₹${o.totalAmount})`,
              isNew: !seenIds.includes(o._id), // Only new if not seen
              link: '/invoice/' + o._id,
            })));
          }
        })
        .catch(() => {});

      const socketUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:8080';
      const socket = io(socketUrl);
      socket.on('new_order', () => {
        setNotifications(prev => [{
          id: Date.now(),
          text: '🛒 New order placed by a customer!',
          isNew: true,
          link: '/admin/orders',
        }, ...prev]);
      });
      return () => socket.disconnect();
    } else {
      // Regular user: load their own recent order status
      getMyOrdersAPI()
        .then(res => {
          const orders = (res.data.data || []).slice(0, 5);
          if (orders.length > 0) {
            const seenIds = JSON.parse(localStorage.getItem('seen_notifs') || '[]');
            setNotifications(orders.map(o => {
              const statusEmoji = {
                placed: '⏳', confirmed: '✅', processing: '⚙️',
                ready: '📦', completed: '🎉', cancelled: '❌', cancel_requested: '⚠️',
              }[o.orderStatus] || '📋';
              // It's a new notification if it's in a notable status AND we haven't seen it in this status
              // For robustness, combine order ID and status string to track if THIS status was seen
              const notifId = `${o._id}_${o.orderStatus}`;
              return {
                id: notifId,
                realId: o._id,
                text: `${statusEmoji} Order ${o.orderNumber} — ${o.orderStatus.replace('_', ' ')} (₹${o.totalAmount})`,
                isNew: (o.orderStatus === 'confirmed' || o.orderStatus === 'ready' || o.orderStatus === 'completed') && !seenIds.includes(notifId),
                link: '/invoice/' + o._id,
              };
            }));
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleLogout = () => { logout(); window.location.href = '/'; };
  const isHome = location.pathname === '/';

  const handleToggle = () => {
    setToggling(true);
    setTimeout(() => setToggling(false), 600);
    toggleTheme();
  };

  const getClass = (path) => {
    if (path === '/') return 'header__link';
    if (path === '/collection') {
      return `header__link${location.pathname.startsWith('/collection') ? ' header__link--active' : ''}`;
    }
    return `header__link${location.pathname === path ? ' header__link--active' : ''}`;
  };

  return (
    <header className={`header ${scrolled || !isHome ? 'header--solid' : ''}`}>
      <div className="header__inner container">

        <Link to="/" className="header__logo">
          <span className="header__logo-icon">✦</span>
          <span className="header__logo-text">LUXE LIBRARY</span>
        </Link>

        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          <Link to="/" className={getClass('/')}>Home</Link>
          <Link to="/collection" className={getClass('/collection')}>Collection</Link>
          <Link to="/about" className={getClass('/about')}>About</Link>
          <Link to="/contact" className={getClass('/contact')}>Contact</Link>
          {user && (
            <Link
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              className={`header__link${location.pathname.startsWith('/admin') || location.pathname === '/dashboard' ? ' header__link--active' : ''}`}
            >
              {user.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
            </Link>
          )}

          {/* Theme Toggle - Mobile Only */}
          <div className="header__mobile-only-theme">
            <button
              className={`theme-toggle ${isDark ? 'theme-toggle--dark' : 'theme-toggle--light'} ${toggling ? 'theme-toggle--spinning' : ''}`}
              onClick={handleToggle}
              aria-label="Toggle theme"
            >
              <span className="theme-toggle__track">
                <span className="theme-toggle__thumb">
                  <span className="theme-toggle__icon">{isDark ? '🌙' : '☀️'}</span>
                </span>
              </span>
              <span className="theme-toggle__label">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </nav>

        <div className="header__auth">
          {/* Theme Toggle */}
          <button
            className={`theme-toggle ${isDark ? 'theme-toggle--dark' : 'theme-toggle--light'} ${toggling ? 'theme-toggle--spinning' : ''}`}
            onClick={handleToggle}
            aria-label="Toggle theme"
          >
            <span className="theme-toggle__track">
              <span className="theme-toggle__thumb">
                <span className="theme-toggle__icon">{isDark ? '🌙' : '☀️'}</span>
              </span>
            </span>
            <span className="theme-toggle__label">{isDark ? 'Dark' : 'Light'}</span>
          </button>

          {/* Cart Icon */}
          <Link to="/cart" className="header__cart" title="My Cart">
            <span className="header__cart-icon">🛒</span>
            {count > 0 && (
              <span className="header__cart-badge">{count}</span>
            )}
          </Link>

          {/* Notifications Bell */}
          {user && (
            <div className="header__notif" title="Notifications" onClick={() => setShowNotif(!showNotif)} style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="header__cart-icon" style={{ fontSize: '20px' }}>🔔</span>
              {notifications.filter(n => n.isNew).length > 0 && (
                <span className="header__cart-badge" style={{ background: '#e74c3c' }}>{notifications.filter(n => n.isNew).length}</span>
              )}
              {showNotif && (
                <div style={{
                  position: 'absolute', top: '48px', right: '-10px',
                  width: 'min(300px, calc(100vw - 30px))',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '14px', padding: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)', zIndex: 200,
                  display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'default'
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color2)', paddingBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>🔔 Notifications</h4>
                    {notifications.length > 0 && (
                      <button onClick={() => {
                        const seenIds = JSON.parse(localStorage.getItem('seen_notifs') || '[]');
                        const updatedIds = [...seenIds, ...notifications.map(n => n.id)];
                        localStorage.setItem('seen_notifs', JSON.stringify([...new Set(updatedIds)]));
                        setNotifications(prev => prev.map(x => ({ ...x, isNew: false })));
                      }} style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>✓ No new notifications</span>
                  ) : (
                    <>
                      {notifications.map(n => (
                        <div key={n.id} onClick={() => {
                          const seenIds = JSON.parse(localStorage.getItem('seen_notifs') || '[]');
                          if (!seenIds.includes(n.id)) {
                            localStorage.setItem('seen_notifs', JSON.stringify([...seenIds, n.id]));
                          }
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isNew: false } : x));
                          window.open(n.link || (user?.role === 'admin' ? '/admin/orders' : '/dashboard'), '_blank');
                          setShowNotif(false);
                        }} style={{
                          background: n.isNew ? 'rgba(201,168,76,0.08)' : 'var(--bg-card2)',
                          padding: '10px 12px', borderRadius: '8px', fontSize: '12px',
                          color: 'var(--text-secondary)', border: `1px solid ${n.isNew ? 'rgba(201,168,76,0.3)' : 'var(--border-color2)'}`,
                          cursor: 'pointer', lineHeight: 1.5
                        }}>
                          {n.isNew && <span style={{ color: 'var(--gold)', fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: 2 }}>● NEW</span>}
                          {n.text}
                        </div>
                      ))}
                      <button onClick={() => { navigate(user?.role === 'admin' ? '/admin/orders' : '/dashboard'); setShowNotif(false); }} style={{ background: 'var(--gold)', border: 'none', borderRadius: '8px', padding: '8px', color: '#000', fontWeight: 600, fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>
                        {user?.role === 'admin' ? 'View All Orders →' : 'My Dashboard →'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="header__user">
              <div className="header__avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="header__user-info">
                <span className="header__user-name">{user.name}</span>
                <span className="header__user-role">{user.role}</span>
              </div>
              <button className="header__logout" onClick={handleLogout}>Sign Out</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="header__btn-ghost">Sign In</Link>
              <Link to="/signup" className="header__btn-gold">Join Now</Link>
            </>
          )}
        </div>

        <button className={`header__hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}