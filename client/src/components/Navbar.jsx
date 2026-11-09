import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand / Logo */}
        <Link to="/" className="brand-logo" onClick={closeMenu}>
          <span className="brand-title">MIDHUN</span>
          <span className="brand-subtitle">PENCIL PORTRAITS</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Gallery
          </NavLink>
          <a href="/#rates" className="nav-link">
            Rates & Sizes
          </a>
          <a href="/#workflow" className="nav-link">
            Artisan Process
          </a>
          <a href="/#artist" className="nav-link">
            The Artist
          </a>
          <NavLink
            to="/give-order"
            className={({ isActive }) => (isActive ? 'nav-cta active' : 'nav-cta')}
          >
            Give Your Order
          </NavLink>
        </nav>

        {/* User / Authentication Actions */}
        <div className="header-actions">
          {user ? (
            <div className="user-nav-block">
              {user.role === 'admin' ? (
                <>
                  <Link to="/admin" className="role-tag-block role-admin-block">
                    SUPER_ADMIN
                  </Link>
                  <Link to="/admin" className="nav-action-btn">
                    Admin Portal
                  </Link>
                </>
              ) : (
                <>
                  <span className="user-greeting">
                    {user.name}
                  </span>
                  <Link to="/my-orders" className="nav-action-btn">
                    My Orders
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="btn-logout-block">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="auth-links-group">
              <Link to="/login" className="nav-link-login">
                Sign In
              </Link>
              <Link to="/register" className="btn-signup-block">
                Sign Up
              </Link>
              <Link to="/admin/login" className="admin-access-anchor" title="Studio Admin Access">
                Admin
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
            Gallery Portfolio
          </Link>
          <a href="/#rates" className="mobile-nav-link" onClick={closeMenu}>
            Pricing & Sizes
          </a>
          <a href="/#workflow" className="mobile-nav-link" onClick={closeMenu}>
            Artisan Workflow
          </a>
          <a href="/#artist" className="mobile-nav-link" onClick={closeMenu}>
            About Midhun
          </a>
          <Link to="/give-order" className="mobile-cta-link" onClick={closeMenu}>
            Give Your Order
          </Link>

          <div className="mobile-auth-divider"></div>

          {user ? (
            <div className="mobile-auth-group">
              <div className="mobile-user-info">
                Signed in as: <strong>{user.name}</strong> ({user.role})
              </div>
              {user.role === 'admin' ? (
                <Link to="/admin" className="mobile-nav-link" onClick={closeMenu}>
                  Admin Portal & Orders
                </Link>
              ) : (
                <Link to="/my-orders" className="mobile-nav-link" onClick={closeMenu}>
                  My Orders & Receipts
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  closeMenu();
                }}
                className="mobile-logout-btn"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="mobile-auth-group">
              <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>
                Sign In
              </Link>
              <Link to="/register" className="mobile-signup-btn" onClick={closeMenu}>
                Sign Up
              </Link>
              <Link to="/admin/login" className="mobile-admin-link" onClick={closeMenu}>
                Artist Admin Login
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

