import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please provide administrative credentials.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(formData.email, formData.password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Authentication rejected. Administrative access restricted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-block admin-auth-theme">
        <div className="auth-card-header">
          <div className="role-tag-block role-admin-block" style={{ marginBottom: '1rem', display: 'inline-block' }}>
            SUPER_ADMIN
          </div>
          <h2 className="auth-heading">Studio Master Administration</h2>
          <div className="gold-accent-line"></div>
          <p className="auth-lead-text">
            Restricted access for Artist Midhun R S. Manage live commission requests, upload gallery pieces,
            update artwork pricing, and monitor tax invoicing.
          </p>
        </div>

        {error && (
          <div className="alert-box-block alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-block">
          <div className="form-group-block">
            <label htmlFor="admin-email" className="form-label">
              Master Admin Email
            </label>
            <input
              type="email"
              id="admin-email"
              name="email"
              className="form-input-block"
              placeholder="Admin email address"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group-block">
            <label htmlFor="admin-password" className="form-label">
              Admin Password / Secret Key
            </label>
            <input
              type="password"
              id="admin-password"
              name="password"
              className="form-input-block"
              placeholder="Enter studio master password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? 'Authenticating Studio Master...' : 'Enter Admin Portal'}
          </button>
        </form>

        <div className="auth-footer-nav">
          <p className="auth-footer-text">
            Looking for regular client portal?{' '}
            <Link to="/login" className="auth-footer-link">
              Client Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

