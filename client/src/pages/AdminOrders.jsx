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
        setError(data.message || data.error || 'Failed to retrieve orders');
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
        body: JSON.stringify({ orderId, order_status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Order status updated to "${newStatus}" successfully.`);
        // Update local state
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, order_status: newStatus } : o))
        );
      } else {
        setError(data.message || data.error || 'Failed to update order status');
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
            <div key={ord._id || ord.order_number} className="admin-order-card">
              <div className="admin-order-header-row">
                <div className="order-primary-info">
                  <span className="order-card-ref">Order Ref: <strong>{ord.order_number}</strong></span>
                  <span className="order-date-text">
                    Received: {new Date(ord.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="order-status-control-box">
                  <label className="status-control-label">Milestone Status:</label>
                  <select
                    value={ord.order_status || 'Pending'}
                    onChange={(e) => handleStatusChange(ord._id || ord.id, e.target.value)}
                    disabled={updatingId === (ord._id || ord.id)}
                    className="admin-status-select"
                  >
                    {(ord.order_status && !STATUS_OPTIONS.includes(ord.order_status)
                      ? [ord.order_status, ...STATUS_OPTIONS]
                      : STATUS_OPTIONS
                    ).map((st) => (
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
                  {ord.reference_photo ? (
                    <div
                      className="admin-photo-wrapper"
                      onClick={() => setPreviewPhoto(ord.reference_photo)}
                      title="Click to inspect full resolution photograph"
                    >
                      <img
                        src={ord.reference_photo}
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
                    <span className="field-value"><strong>{ord.portrait_size}</strong></span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Medium:</span>
                    <span className="field-value">{ord.portrait_medium}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Subjects / Faces:</span>
                    <span className="field-value">{ord.num_faces} Face(s)</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Framing Choice:</span>
                    <span className="field-value">{ord.frame_type}</span>
                  </div>
                  {ord.isExpress && (
                    <div className="detail-field">
                      <span className="field-name">Turnaround:</span>
                      <span className="field-value gold-text"><strong>VIP Express Priority</strong></span>
                    </div>
                  )}
                  {ord.special_instructions && (
                    <div className="detail-field instructions-box">
                      <span className="field-name">Client Notes:</span>
                      <p className="field-value client-notes-text">{ord.special_instructions}</p>
                    </div>
                  )}
                </div>

                {/* Client Contact & Shipping */}
                <div className="admin-shipping-col">
                  <div className="detail-field">
                    <span className="field-name">Client:</span>
                    <span className="field-value"><strong>{ord.customer_name}</strong></span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Email:</span>
                    <span className="field-value">{ord.customer_email}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Phone:</span>
                    <span className="field-value">{ord.customer_phone}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-name">Address:</span>
                    <span className="field-value">
                      {ord.shipping_address}, {ord.city}, {ord.state} - {ord.pincode}
                    </span>
                  </div>
                </div>

                {/* Financial Summary & Actions */}
                <div className="admin-financial-col">
                  <div className="financial-amount">
                    ₹{ord.total_amount?.toLocaleString('en-IN')}
                  </div>
                  <div className={`status-block ${ord.payment_status?.toLowerCase() === 'paid' ? 'status-block-paid' : 'status-block-pending'}`} style={{ marginBottom: '0.75rem' }}>
                    Payment: {ord.payment_status || 'Pending'}
                  </div>
                  <div className="table-subtext">Method: {ord.payment_method || 'Online'}</div>
                  {ord.transaction_id && (
                    <div className="table-subtext">TXN: {ord.transaction_id}</div>
                  )}

                  <div className="order-card-actions">
                    <Link
                      to={`/receipt/${ord.order_number}`}
                      className="btn-admin-view-receipt"
                    >
                      Tax Invoice
                    </Link>
                    <a
                      href={apiUrl(`/api/billing/receipt/${ord.order_number}/download-pdf`)}
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

