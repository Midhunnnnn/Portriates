import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, apiUrl } from '../config/api';

const STATUS_OPTIONS = [
  'Pending',
  'Payment Received',
  'Penciling in Progress',
  'Digital Proof Sent',
  'Framing & Archival Sealing',
  'Shipped',
  'Delivered'
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await apiFetch('/api/admin/orders');
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to retrieve orders');
      }
    } catch (err) {
      setError('Error communicating with studio server');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderStatus: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Order status updated to "${newStatus}" successfully.`);
        // Update local state
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
      } else {
        setError(data.message || 'Failed to update order status');
      }
    } catch (err) {
      setError('Network error while updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header-block">
        <div className="admin-header-left">
          <Link to="/admin" className="admin-back-breadcrumb">
            &larr; Back to Dashboard
          </Link>
          <h1 className="admin-page-title">Manage Client Commissions</h1>
          <p className="admin-welcome-sub">
            Inspect uploaded reference photographs, monitor payment confirmations, and update milestone statuses.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link to="/admin/artworks" className="btn-admin-nav">
            Manage Gallery Pieces
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-box-block alert-error admin-alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert-box-block alert-success admin-alert">
          {success}
        </div>
      )}

      {loading ? (
        <div className="loading-state-block">
          <p>Loading commission records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state-block">
          <p>No client commission requests found.</p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {orders.map((ord) => (
            <div key={ord._id || ord.orderNumber} className="admin-order-card">
              <div className="admin-order-header-row">
                <div className="order-primary-info">
                  <span className="order-card-ref">Order Ref: <strong>{ord.orderNumber}</strong></span>
                  <span className="order-date-text">
                    Received: {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="order-status-control-box">
                  <label className="status-control-label">Milestone Status:</label>
                  <select
                    value={ord.orderStatus || 'Pending'}
                    onChange={(e) => handleStatusChange(ord._id || ord.id, e.target.value)}
                    disabled={updatingId === (ord._id || ord.id)}
                    className="admin-status-select"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-order-grid">
                {/* Reference Photo Box */}
                <div className="admin-photo-col">
                  {ord.referencePhoto ? (
                    <div
                      className="admin-photo-wrapper"
                      onClick={() => setPreviewPhoto(ord.referencePhoto)}
                      title="Click to inspect full resolution photograph"
                    >
                      <img
                        src={ord.referencePhoto}
                        alt="Client Reference"
                        className="admin-photo-thumb"
                      />
                      <span className="inspect-photo-badge">Click to Enlarge</span>
                    </div>
                  ) : (
                    <div className="no-photo-box">No photo uploaded</div>
                  )}
                </div>

                {/* Commission Specifications */}
                <div className="admin-details-col">
                  <div className="detail-field">
                    <span className="field-name">Dimension:</span>
                    <span className="field-value"><strong>{ord.size}</strong></span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Medium:</span>
                    <span className="field-value">{ord.medium}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Subjects / Faces:</span>
                    <span className="field-value">{ord.faces} Face(s)</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Framing Choice:</span>
                    <span className="field-value">{ord.framing}</span>
                  </div>
                  {ord.isExpress && (
                    <div className="detail-field">
                      <span className="field-name">Turnaround:</span>
                      <span className="field-value gold-text"><strong>VIP Express Priority</strong></span>
                    </div>
                  )}
                  {ord.specialInstructions && (
                    <div className="detail-field instructions-box">
                      <span className="field-name">Client Notes:</span>
                      <p className="field-value client-notes-text">{ord.specialInstructions}</p>
                    </div>
                  )}
                </div>

                {/* Client Contact & Shipping */}
                <div className="admin-shipping-col">
                  <div className="detail-field">
                    <span className="field-name">Client:</span>
                    <span className="field-value"><strong>{ord.customerName}</strong></span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Email:</span>
                    <span className="field-value">{ord.customerEmail}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Phone:</span>
                    <span className="field-value">{ord.customerPhone}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Address:</span>
                    <span className="field-value">
                      {ord.shippingAddress}, {ord.city}, {ord.state} - {ord.pincode}
                    </span>
                  </div>
                </div>

                {/* Financial Summary & Actions */}
                <div className="admin-financial-col">
                  <div className="financial-amount">
                    ₹{ord.totalPrice?.toLocaleString('en-IN')}
                  </div>
                  <div className={`status-block ${ord.paymentStatus === 'PAID' ? 'status-block-paid' : 'status-block-pending'}`} style={{ marginBottom: '0.75rem' }}>
                    Payment: {ord.paymentStatus || 'Pending'}
                  </div>
                  <div className="table-subtext">Method: {ord.paymentMethod || 'Online'}</div>
                  {ord.transactionId && (
                    <div className="table-subtext">TXN: {ord.transactionId}</div>
                  )}

                  <div className="order-card-actions">
                    <Link
                      to={`/receipt/${ord.orderNumber}`}
                      className="btn-admin-view-receipt"
                    >
                      Tax Invoice
                    </Link>
                    <a
                      href={apiUrl(`/api/billing/receipt/${ord.orderNumber}/download-pdf`)}
                      className="btn-admin-pdf-btn"
                    >
                      PDF Receipt
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* High-Resolution Photo Lightbox */}
      {previewPhoto && (
        <div className="modal-backdrop" onClick={() => setPreviewPhoto(null)}>
          <div className="modal-photo-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setPreviewPhoto(null)}>
              &times;
            </button>
            <img src={previewPhoto} alt="High Resolution Reference" className="modal-photo-full" />
            <div className="modal-photo-footer">
              <a href={previewPhoto} target="_blank" rel="noreferrer" className="btn-modal-open-tab">
                Open in New Tab
              </a>
              <button onClick={() => setPreviewPhoto(null)} className="btn-modal-back">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

