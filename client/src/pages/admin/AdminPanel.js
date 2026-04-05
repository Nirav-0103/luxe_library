import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminBadgesAPI } from '../../api';
import './AdminPanel.css';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badges, setBadges] = useState({ orders: 0, refunds: 0, issues: 0, complaints: 0 });

  // Poll for pending item counts every 30s
  useEffect(() => {
    const fetchBadges = () => {
      getAdminBadgesAPI()
        .then(res => {
          if (res.data?.data) setBadges(res.data.data);
        })
        .catch(() => {});
    };
    fetchBadges();
    const t = setInterval(fetchBadges, 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const MENU = [
    { to: '/admin',           label: 'Dashboard', icon: '📊', end: true },
    { to: '/admin/orders',    label: 'Orders',    icon: '🛒', badge: badges.orders },
    { to: '/admin/refunds',   label: 'Refunds',   icon: '↩️', badge: badges.refunds },
    { to: '/admin/books',     label: 'Books',     icon: '📚' },
    { to: '/admin/members',   label: 'Members',   icon: '🪪' },
    { to: '/admin/issues',    label: 'Issues',    icon: '🔄', badge: badges.issues },
    { to: '/admin/complaints', label: 'Complaints', icon: '📝', badge: badges.complaints },
    { to: '/admin/users',     label: 'Users',     icon: '👥' },
    { to: '/admin/settings',  label: 'Settings',  icon: '⚙️' },
  ];


  return (
    <div className={`admin ${collapsed ? 'admin--collapsed' : ''} ${mobileMenuOpen ? 'admin--mobile-open' : ''}`}>
      {/* Mobile Topbar */}
      <div className="admin__mobile-header">
        <div className="admin__mobile-brand">
          <span className="admin__brand-icon">✦</span> LUXE ADMIN
        </div>
        <button className="admin__mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="admin__mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <aside className="admin__sidebar">
        <div className="admin__sidebar-top">
          <div className="admin__brand">
            <span className="admin__brand-icon">✦</span>
            {!collapsed && <span className="admin__brand-text">LUXE LIBRARY</span>}
          </div>
          <button className="admin__collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="admin__nav">
          {MENU.map(m => (
            <NavLink
              onClick={() => setMobileMenuOpen(false)}
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) => `admin__nav-link ${isActive ? 'active' : ''}`}
              title={collapsed ? m.label : ''}
            >
              <span className="admin__nav-icon">{m.icon}</span>
              {!collapsed && <span className="admin__nav-label">{m.label}</span>}
              {m.badge > 0 && (
                <span style={{
                  marginLeft: collapsed ? 0 : 'auto',
                  background: '#e74c3c',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: '16px',
                  flexShrink: 0,
                  animation: 'badgePop 0.3s ease',
                }}>
                  {m.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin__sidebar-footer">
          {!collapsed && (
            <div className="admin__user-info">
              <div className="admin__user-avatar">{user?.name?.charAt(0)}</div>
              <div>
                <div className="admin__user-name">{user?.name}</div>
                <div className="admin__user-role">{user?.role}</div>
              </div>
            </div>
          )}
          <button className="admin__logout-btn" onClick={handleLogout}>
            🚪 {!collapsed && 'Sign Out'}
          </button>
          <NavLink to="/" className="admin__back-link">
            🌐 {!collapsed && 'Back to Site'}
          </NavLink>
        </div>
      </aside>

      <main className="admin__main">
        <div className="admin__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}