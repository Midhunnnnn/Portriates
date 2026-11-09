import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = location.state?.from || '/';

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
      setError('Please provide your email and password');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-block">
        <div className="auth-card-header">
          <span className="auth-sub-tag">CLIENT PORTAL</span>
          <h2 className="auth-heading">Sign In to Your Account</h2>
          <div className="gold-accent-line"></div>
          <p className="auth-lead-text">
            Access your portrait commissions, monitor drawing progress, and download tax invoices.
          </p>
        </div>

        {error && (
          <div className="alert-box-block alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-block">
          <div className="form-group-block">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input-block"
              placeholder="e.g. yourname@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group-block">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input-block"
              placeholder="Enter your account password"
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
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer-nav">
          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-footer-link">
              Create an account with Email OTP
            </Link>
          </p>

          <div className="admin-discrete-link-box">
            <Link to="/admin/login" className="admin-discrete-link">
              Artist Studio Administration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

