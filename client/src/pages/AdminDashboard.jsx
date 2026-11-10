import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalArtworks: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [smtpStatus, setSmtpStatus] = useState('');
  const [testingSmtp, setTestingSmtp] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch('/api/admin/dashboard');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats({
          totalOrders: data.stats?.totalOrders || 0,
          totalRevenue: data.stats?.totalRevenue || 0,
          pendingOrders: (data.stats?.pendingOrders || 0) + (data.stats?.inProgressOrders || 0),
          totalArtworks: data.stats?.totalArtworks ?? data.artworksCount ?? 0
        });
        setRecentOrders(data.recentOrders || []);
      } else {
        setError(data.message || data.error || 'Failed to load dashboard metrics');
      }
    } catch (err) {
      setError('Error loading administrative data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpStatus('');
    try {
      const res = await apiFetch('/api/admin/test-email');
      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpStatus(data.message || 'Nodemailer test successful! Diagnostic email delivered to midhunrs727@gmail.com.');
      } else {
        setSmtpStatus('Nodemailer test error: ' + (data.message || data.error || 'Verification failed'));
      }
    } catch (err) {
      setSmtpStatus('Failed to test SMTP connection.');
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header-block">
        <div className="admin-header-left">
          <div className="role-tag-block role-admin-block" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
            SUPER_ADMIN
          </div>
          <h1 className="admin-page-title">Studio Master Dashboard</h1>
          <p className="admin-welcome-sub">
            Welcome back, <strong>{user?.name || 'Midhun R S'}</strong>. Manage commissions, inventory, and billing.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link to="/admin/artworks" className="btn-admin-nav">
            Manage Gallery Artworks
          </Link>
          <Link to="/admin/orders" className="btn-admin-nav btn-admin-primary">
            Manage Commissions
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-box-block alert-error admin-alert">
          {error}
        </div>
      )}

      {smtpStatus && (
        <div className="alert-box-block alert-success admin-alert">
          {smtpStatus}
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="admin-stats-grid">
        <div className="stat-card-block">
          <span className="stat-label">Total Commission Revenue</span>
          <div className="stat-value">₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
          <span className="stat-footnote">Verified payments processed</span>
        </div>

        <div className="stat-card-block">
          <span className="stat-label">Total Client Orders</span>
          <div className="stat-value">{stats.totalOrders || 0}</div>
          <span className="stat-footnote">Commission requests received</span>
        </div>

        <div className="stat-card-block">
          <span className="stat-label">Pending / In-Progress</span>
          <div className="stat-value">{stats.pendingOrders || 0}</div>
          <span className="stat-footnote">Portraits currently on easel</span>
        </div>

        <div className="stat-card-block">
          <span className="stat-label">Live Gallery Artworks</span>
          <div className="stat-value">{stats.totalArtworks || 0}</div>
          <span className="stat-footnote">Displayed in studio portfolio</span>
        </div>
      </div>

      {/* SMTP Diagnostic Tool */}
      <div className="admin-smtp-panel">
        <div className="smtp-info-col">
          <h4 className="smtp-title">Nodemailer Dispatch Diagnostics</h4>
          <p className="smtp-desc">
            Verify automated email dispatch for client OTP verifications, payment confirmations, and PDF invoice delivery.
          </p>
        </div>
        <button
          onClick={handleTestSmtp}
          disabled={testingSmtp}
          className="btn-smtp-test"
        >
          {testingSmtp ? 'Testing Dispatch...' : 'Run SMTP Health Test'}
        </button>
      </div>

      {/* Recent Commissions Table */}
      <div className="admin-card-section">
        <div className="section-title-row">
          <h3 className="section-title-text">Recent Commission Requests</h3>
          <Link to="/admin/orders" className="link-view-all">
            View All Commissions &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="loading-state-block">
            <p>Loading recent commissions...</p>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="empty-state-block">
            <p>No commissions placed yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Client</th>
                  <th>Specs</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Commission Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord._id || ord.order_number}>
                    <td><strong>{ord.order_number}</strong></td>
                    <td>
                      <div><strong>{ord.customer_name}</strong></div>
                      <div className="table-subtext">{ord.customer_email}</div>
                    </td>
                    <td>
                      <div>{ord.portrait_size}</div>
                      <div className="table-subtext">{ord.portrait_medium}</div>
                    </td>
                    <td><strong>₹{ord.total_amount?.toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span className={`status-block ${ord.payment_status?.toLowerCase() === 'paid' ? 'status-block-paid' : 'status-block-pending'}`}>
                        {ord.payment_status}
                      </span>
                    </td>
                    <td>
                      <span className="status-block status-block-progress">
                        {ord.order_status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <Link to="/admin/orders" className="btn-table-action">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

