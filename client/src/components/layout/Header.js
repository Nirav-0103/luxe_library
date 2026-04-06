import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    if (user?.role === 'admin') {
      getAdminOrdersAPI({ status: 'placed' })
        .then(res => {
          const placed = res.data.data || [];
          if (placed.length > 0) {
            const seenIds = JSON.parse(localStorage.getItem('seen_notifs') || '[]');
            setNotifications(placed.map(o => ({
              id: o._id,
              text: `📦 Order ${o.orderNumber} — ${o.user?.name || 'Customer'} (₹${o.totalAmount})`,
              isNew: !seenIds.includes(o._id),
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

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    if (showNotif) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotif]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

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

  const newNotifCount = notifications.filter(n => n.isNew).length;

  return (
    <>
    <header className={`header ${scrolled || !isHome ? 'header--solid' : ''}`}>

      <div className="header__inner container">

        <Link to="/" className="header__logo">
          <span className="header__logo-icon">✦</span>
          <span className="header__logo-text">LUXE LIBRARY</span>
        </Link>

        {/* ── DESKTOP NAV ── */}
        <nav className="header__nav header__nav--desktop">
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
        </nav>

        {/* ── DESKTOP AUTH ── */}
        <div className="header__auth header__auth--desktop">
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
            {count > 0 && <span className="header__cart-badge">{count}</span>}
          </Link>

          {/* Notifications Bell */}
          {user && (
            <div
              className="header__notif"
              ref={notifRef}
              title="Notifications"
              onClick={() => setShowNotif(!showNotif)}
            >
              <span className="header__cart-icon" style={{ fontSize: '20px' }}>🔔</span>
              {newNotifCount > 0 && (
                <span className="header__cart-badge" style={{ background: '#e74c3c' }}>{newNotifCount}</span>
              )}
              {showNotif && (
                <div className="notif-dropdown" onClick={e => e.stopPropagation()}>
                  <div className="notif-dropdown__header">
                    <h4>🔔 Notifications</h4>
                    {notifications.length > 0 && (
                      <button onClick={() => {
                        const seenIds = JSON.parse(localStorage.getItem('seen_notifs') || '[]');
                        const updatedIds = [...seenIds, ...notifications.map(n => n.id)];
                        localStorage.setItem('seen_notifs', JSON.stringify([...new Set(updatedIds)]));
                        setNotifications(prev => prev.map(x => ({ ...x, isNew: false })));
                      }} className="notif-dropdown__mark-read">Mark all read</button>
                    )}
                  </div>
                  <div className="notif-dropdown__body">
                    {notifications.length === 0 ? (
                      <span className="notif-dropdown__empty">✓ No new notifications</span>
                    ) : (
                      <>
                        {notifications.map(n => (
                          <div key={n.id} className={`notif-dropdown__item${n.isNew ? ' notif-dropdown__item--new' : ''}`}
                            onClick={() => {
                              const seenIds = JSON.parse(localStorage.getItem('seen_notifs') || '[]');
                              if (!seenIds.includes(n.id)) {
                                localStorage.setItem('seen_notifs', JSON.stringify([...seenIds, n.id]));
                              }
                              setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isNew: false } : x));
                              window.open(n.link || (user?.role === 'admin' ? '/admin/orders' : '/dashboard'), '_blank');
                              setShowNotif(false);
                            }}>
                            {n.isNew && <span className="notif-dropdown__new-badge">● NEW</span>}
                            {n.text}
                          </div>
                        ))}
                        <button
                          onClick={() => { navigate(user?.role === 'admin' ? '/admin/orders' : '/dashboard'); setShowNotif(false); }}
                          className="notif-dropdown__view-all"
                        >
                          {user?.role === 'admin' ? 'View All Orders →' : 'My Dashboard →'}
                        </button>
                      </>
                    )}
                  </div>
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

        {/* ── MOBILE RIGHT AREA ── */}
        <div className="header__mobile-right">
          {!user ? (
            <>
              <Link to="/login" className="header__btn-ghost header__btn-ghost--mobile">Sign In</Link>
              <Link to="/signup" className="header__btn-gold header__btn-gold--mobile">Join Now</Link>
            </>
          ) : (
            <div className="header__mobile-notif-wrap" ref={notifRef}>
              <button
                className="header__mobile-notif-btn"
                onClick={() => setShowNotif(!showNotif)}
                aria-label="Notifications"
              >
                🔔
                {newNotifCount > 0 && (
                  <span className="header__cart-badge" style={{ background: '#e74c3c', position: 'absolute', top: '-4px', right: '-4px' }}>{newNotifCount}</span>
                )}
              </button>
              {showNotif && (
                <div className="notif-dropdown notif-dropdown--mobile" onClick={e => e.stopPropagation()}>
                  <div className="notif-dropdown__header">
                    <h4>🔔 Notifications</h4>
                    {notifications.length > 0 && (
                      <button onClick={() => {
                        const seenIds = JSON.parse(localStorage.getItem('seen_notifs') || '[]');
                        const updatedIds = [...seenIds, ...notifications.map(n => n.id)];
                        localStorage.setItem('seen_notifs', JSON.stringify([...new Set(updatedIds)]));
                        setNotifications(prev => prev.map(x => ({ ...x, isNew: false })));
                      }} className="notif-dropdown__mark-read">Mark all read</button>
                    )}
                  </div>
                  <div className="notif-dropdown__body">
                    {notifications.length === 0 ? (
                      <span className="notif-dropdown__empty">✓ No new notifications</span>
                    ) : (
                      <>
                        {notifications.map(n => (
                          <div key={n.id} className={`notif-dropdown__item${n.isNew ? ' notif-dropdown__item--new' : ''}`}
                            onClick={() => {
                              const seenIds = JSON.parse(localStorage.getItem('seen_notifs') || '[]');
                              if (!seenIds.includes(n.id)) {
                                localStorage.setItem('seen_notifs', JSON.stringify([...seenIds, n.id]));
                              }
                              setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isNew: false } : x));
                              navigate(n.link || (user?.role === 'admin' ? '/admin/orders' : '/dashboard'));
                              setShowNotif(false);
                            }}>
                            {n.isNew && <span className="notif-dropdown__new-badge">● NEW</span>}
                            {n.text}
                          </div>
                        ))}
                        <button
                          onClick={() => { navigate(user?.role === 'admin' ? '/admin/orders' : '/dashboard'); setShowNotif(false); }}
                          className="notif-dropdown__view-all"
                        >
                          {user?.role === 'admin' ? 'View All Orders →' : 'My Dashboard →'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hamburger */}
          <button
            className={`header__hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

      </div>
    </header>

    {ReactDOM.createPortal(
      <>
        {/* Dark overlay */}
        <div
          className={`header__overlay ${menuOpen ? 'header__overlay--visible' : ''}`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Slide-in panel */}
        <div className={`header__mobile-menu ${menuOpen ? 'header__mobile-menu--open' : ''}`}>
          <button className="header__mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>

          <div className="header__mobile-menu-logo">
            <span className="header__logo-icon">✦</span>
            <span className="header__logo-text">LUXE LIBRARY</span>
          </div>

          <nav className="header__mobile-nav">
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

            <Link to="/cart" className="header__mobile-cart-link">
              🛒 My Cart{count > 0 && <span className="header__mobile-cart-count">{count}</span>}
            </Link>

            <div className="header__mobile-divider" />

            <button
              className={`theme-toggle theme-toggle--mobile ${isDark ? 'theme-toggle--dark' : 'theme-toggle--light'} ${toggling ? 'theme-toggle--spinning' : ''}`}
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

            {user ? (
              <div className="header__mobile-user">
                <div className="header__avatar header__avatar--lg">{user.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="header__user-name">{user.name}</div>
                  <div className="header__user-role">{user.role}</div>
                </div>
                <button className="header__mobile-logout" onClick={handleLogout}>Sign Out</button>
              </div>
            ) : (
              <div className="header__mobile-auth-btns">
                <Link to="/login" className="header__btn-ghost header__btn-ghost--full">Sign In</Link>
                <Link to="/signup" className="header__btn-gold header__btn-gold--full">Join Now</Link>
              </div>
            )}
          </nav>
        </div>
      </>,
      document.body
    )}
  </>
  );
}