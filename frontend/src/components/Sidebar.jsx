import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const citizenLinks = [
  { to: '/dashboard',     icon: '🏠', label: 'Home' },
  { to: '/book',          icon: '📅', label: 'Book' },
  { to: '/bookings',      icon: '📋', label: 'Bookings' },
  { to: '/rewards',       icon: '🏆', label: 'Rewards' },
  { to: '/notifications', icon: '🔔', label: 'Alerts' },
  { to: '/profile',       icon: '👤', label: 'Profile' },
];

const adminLinks = [
  { to: '/admin',          icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/bookings', icon: '📋', label: 'Bookings',  end: true },
  { to: '/admin/database', icon: '🗄️', label: 'Database',  end: true },
];

export default function Sidebar({ isAdmin }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin ? adminLinks : citizenLinks;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Bottom nav shows only first 5 links on mobile
  const bottomLinks = links.slice(0, 5);

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-leaf">🌿</span>
          <div><h2>EcoManage</h2><p>Waste to Value</p></div>
        </div>
        <nav className="sidebar-nav">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              id={`nav-${l.label.toLowerCase().replace(/\s/g, '-')}`}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <strong>{user?.name?.split(' ')[0]}</strong>
              <span>{user?.role}</span>
            </div>
          </div>
          <button id="logout-btn" className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="mobile-topbar">
        <div className="mobile-brand">
          <span>🌿</span>
          <span>EcoManage</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ── Mobile Drawer (for extra links & logout) ── */}
      {menuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-user">
              <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <strong>{user?.name}</strong>
                <p style={{ color: 'var(--text2)', fontSize: '.8rem', margin: 0 }}>{user?.email}</p>
              </div>
            </div>
            <nav>
              {links.map(l => (
                <NavLink key={l.to} to={l.to} end={l.end}
                  className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}>
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </NavLink>
              ))}
            </nav>
            <button className="logout-btn" style={{ margin: '1rem' }} onClick={handleLogout}>
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="mobile-bottom-nav">
        {bottomLinks.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <span className="mobile-nav-icon">{l.icon}</span>
            <span className="mobile-nav-label">{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
