import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(formData);
      if (res.success) {
        // Navigate to OTP verification page
        navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-block auth-card-wide">
        <div className="auth-card-header">
          <span className="auth-sub-tag">MEMBERSHIP REGISTRATION</span>
          <h2 className="auth-heading">Create Client Account</h2>
          <div className="gold-accent-line"></div>
          <p className="auth-lead-text">
            Register to track commission milestones, receive high-resolution proofs, and access tax invoices.
            A secure 6-digit verification code will be dispatched to your email address.
          </p>
        </div>

        {error && (
          <div className="alert-box-block alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-block">
          <div className="form-grid-2col">
            <div className="form-group-block">
              <label htmlFor="name" className="form-label">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input-block"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group-block">
              <label htmlFor="email" className="form-label">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input-block"
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group-block">
              <label htmlFor="password" className="form-label">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input-block"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group-block">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input-block"
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group-block">
            <label htmlFor="phone" className="form-label">Phone / WhatsApp Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input-block"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group-block">
            <label htmlFor="address" className="form-label">Default Delivery Street Address</label>
            <textarea
              id="address"
              name="address"
              className="form-textarea-block"
              rows="2"
              placeholder="House/Apartment #, Street, Locality"
              value={formData.address}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-grid-3col">
            <div className="form-group-block">
              <label htmlFor="city" className="form-label">City</label>
              <input
                type="text"
                id="city"
                name="city"
                className="form-input-block"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group-block">
              <label htmlFor="state" className="form-label">State</label>
              <input
                type="text"
                id="state"
                name="state"
                className="form-input-block"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-group-block">
              <label htmlFor="pincode" className="form-label">Pincode</label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                className="form-input-block"
                placeholder="e.g. 695001"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? 'Sending OTP Verification Code...' : 'Register & Receive OTP Code'}
          </button>
        </form>

        <div className="auth-footer-nav">
          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-footer-link">
              Sign In directly
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

