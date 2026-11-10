import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, apiUrl } from '../config/api';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const res = await apiFetch('/api/orders/my-orders');
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || data.error || 'Failed to load commissions');
      }
    } catch (err) {
      setError('Network error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBlockClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'paid':
        return 'status-block-paid';
      case 'in progress':
      case 'sketching in progress':
      case 'penciling in progress':
      case 'drawing':
      case 'framing':
      case 'finishing & framing':
      case 'framing & archival sealing':
      case 'digital proof sent':
      case 'payment received':
      case 'dispatched':
      case 'shipped':
        return 'status-block-progress';
      default:
        return 'status-block-pending';
    }
  };

  return (
    <div className="orders-page-container">
      <div className="orders-page-header">
        <span className="order-eyebrow">CLIENT ARCHIVES & TRACKING</span>
        <h1 className="order-main-heading">My Portrait Commissions</h1>
        <div className="gold-accent-line"></div>
        <p className="order-subtext">
          Review your ongoing and completed pencil art commissions, view payment invoices, and download PDF receipts.
        </p>
      </div>

      {loading ? (
        <div className="loading-state-block">
          <p>Retrieving your commission records...</p>
        </div>
      ) : error ? (
        <div className="alert-box-block alert-error">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-orders-block">
          <h3>No Commissions Placed Yet</h3>
          <p>You have not commissioned any pencil portraits yet. Bring your favorite photograph to life today.</p>
          <Link to="/give-order" className="btn-hero-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Give Your Order
          </Link>
        </div>
      ) : (
        <div className="orders-cards-list">
          {orders.map((ord) => (
            <div key={ord._id || ord.order_number} className="order-history-card">
              <div className="order-card-top-bar">
                <div className="order-top-meta">
                  <span className="order-num-label">Order Ref: <strong>{ord.order_number}</strong></span>
                  <span className="order-date-label">
                    {new Date(ord.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Clean rectangular status block (NO pills, matching border) */}
                <div className={`status-block ${getStatusBlockClass(ord.order_status || ord.payment_status)}`}>
                  {ord.order_status || ord.payment_status || 'Received'}
                </div>
              </div>

              <div className="order-card-content-grid">
                {ord.reference_photo && (
                  <div className="order-ref-thumb-box">
                    <img
                      src={ord.reference_photo}
                      alt="Commission Reference"
                      className="order-ref-thumb"
                    />
                  </div>
                )}

                <div className="order-specs-col">
                  <h4 className="order-item-title">
                    {ord.portrait_size} — {ord.portrait_medium}
                  </h4>
                  <div className="order-sub-specs">
                    <span>Subjects: {ord.num_faces} {Number(ord.num_faces) === 1 ? 'Face' : 'Faces'}</span>
                    <span>•</span>
                    <span>Framing: {ord.frame_type}</span>
                    {ord.isExpress && (
                      <>
                        <span>•</span>
                        <span className="gold-text">VIP Express</span>
                      </>
                    )}
                  </div>
                  <div className="order-delivery-address-snippet">
                    Ship to: {ord.customer_name}, {ord.shipping_address}, {ord.city}
                  </div>
                </div>

                <div className="order-pricing-actions-col">
                  <div className="order-price-display">
                    ₹{ord.total_amount?.toLocaleString('en-IN')}
                  </div>
                  <span className="payment-tag-sub">
                    {ord.payment_status?.toLowerCase() === 'paid' ? 'Payment Verified' : (ord.payment_status || 'Pending Payment')}
                  </span>

                  <div className="order-buttons-group">
                    <Link
                      to={`/receipt/${ord.order_number}`}
                      className="btn-order-action btn-view-invoice"
                    >
                      View Tax Invoice
                    </Link>
                    <a
                      href={apiUrl(`/api/billing/receipt/${ord.order_number}/download-pdf`)}
                      className="btn-order-action btn-download-pdf-sm"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

