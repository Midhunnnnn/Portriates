import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../config/api';

export default function Checkout() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');

  // Editable recipient / address in case they need to adjust it
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const fetchOrder = async () => {
    try {
      const res = await apiFetch(`/api/orders/${orderNumber}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
        setShippingAddress(data.order.shippingAddress || '');
        setCity(data.order.city || '');
        setState(data.order.state || '');
        setPincode(data.order.pincode || '');
        setCustomerPhone(data.order.customerPhone || '');
      } else {
        setError(data.message || 'Order not found');
      }
    } catch (err) {
      setError('Failed to retrieve order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      const res = await apiFetch(`/api/payment/process/${orderNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          upiId,
          shippingAddress,
          city,
          state,
          pincode,
          customerPhone
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment processing failed');
      }

      // Redirect to billing & receipt page
      navigate(`/receipt/${orderNumber}`);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page-container">
        <div className="loading-state-block">
          <p>Loading your commission checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="checkout-page-container">
        <div className="alert-box-block alert-error">
          {error}
        </div>
        <Link to="/give-order" className="btn-hero-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Start a New Commission
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-header-block">
        <span className="order-eyebrow">SECURE 256-BIT ENCRYPTED CHECKOUT</span>
        <h1 className="checkout-main-heading">Complete Commission Payment</h1>
        <div className="gold-accent-line"></div>
        <p className="checkout-subtext">
          Review your portrait commission details, confirm delivery address, and authorize payment to initiate drawing.
        </p>
      </div>

      {error && (
        <div className="alert-box-block alert-error checkout-alert">
          {error}
        </div>
      )}

      <form onSubmit={handlePayment} className="checkout-layout-grid">
        {/* Left Column: Payment & Delivery Information */}
        <div className="checkout-main-col">
          {/* Order Snapshot & Reference */}
          <div className="checkout-card-block">
            <h3 className="checkout-card-title">Commission Snapshot</h3>
            <div className="snapshot-grid">
              {order.referencePhoto && (
                <div className="snapshot-photo-box">
                  <img
                    src={order.referencePhoto}
                    alt="Commission Reference"
                    className="snapshot-thumb"
                  />
                  <span className="snapshot-badge">Reference Photo</span>
                </div>
              )}
              <div className="snapshot-details">
                <div className="snapshot-row">
                  <span className="snap-label">Order Ref:</span>
                  <span className="snap-val"><strong>{order.orderNumber}</strong></span>
                </div>
                <div className="snapshot-row">
                  <span className="snap-label">Medium:</span>
                  <span className="snap-val">{order.medium}</span>
                </div>
                <div className="snapshot-row">
                  <span className="snap-label">Dimension:</span>
                  <span className="snap-val">{order.size}</span>
                </div>
                <div className="snapshot-row">
                  <span className="snap-label">Framing:</span>
                  <span className="snap-val">{order.framing}</span>
                </div>
                <div className="snapshot-row">
                  <span className="snap-label">Subjects:</span>
                  <span className="snap-val">{order.faces} {Number(order.faces) === 1 ? 'Face' : 'Faces'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address Review */}
          <div className="checkout-card-block">
            <h3 className="checkout-card-title">Delivery & Recipient Address</h3>
            <div className="form-group-block">
              <label className="form-label">Recipient Name</label>
              <input
                type="text"
                className="form-input-block"
                value={order.customerName}
                disabled
              />
            </div>

            <div className="form-group-block">
              <label className="form-label">Shipping Street Address *</label>
              <textarea
                className="form-textarea-block"
                rows="2"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="form-grid-3col">
              <div className="form-group-block">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  className="form-input-block"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-block">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  className="form-input-block"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-block">
                <label className="form-label">Pincode *</label>
                <input
                  type="text"
                  className="form-input-block"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group-block">
              <label className="form-label">Contact / WhatsApp Phone *</label>
              <input
                type="tel"
                className="form-input-block"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="checkout-card-block">
            <h3 className="checkout-card-title">Select Payment Channel</h3>

            <div className="payment-options-grid">
              {/* UPI Option */}
              <label
                className={`payment-choice-block ${paymentMethod === 'UPI' ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="hidden-radio"
                />
                <div className="payment-choice-content">
                  <strong>Instant UPI Transfer</strong>
                  <span className="pay-subtext">Google Pay, PhonePe, Paytm, BHIM</span>
                </div>
              </label>

              {/* Card Option */}
              <label
                className={`payment-choice-block ${paymentMethod === 'Card' ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Card"
                  checked={paymentMethod === 'Card'}
                  onChange={() => setPaymentMethod('Card')}
                  className="hidden-radio"
                />
                <div className="payment-choice-content">
                  <strong>Credit / Debit Card</strong>
                  <span className="pay-subtext">Visa, Mastercard, RuPay, Amex</span>
                </div>
              </label>

              {/* Net Banking Option */}
              <label
                className={`payment-choice-block ${paymentMethod === 'NetBanking' ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="NetBanking"
                  checked={paymentMethod === 'NetBanking'}
                  onChange={() => setPaymentMethod('NetBanking')}
                  className="hidden-radio"
                />
                <div className="payment-choice-content">
                  <strong>Net Banking</strong>
                  <span className="pay-subtext">All Major Indian Banks Supported</span>
                </div>
              </label>

              {/* Cash On Delivery */}
              <label
                className={`payment-choice-block ${paymentMethod === 'COD' ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="hidden-radio"
                />
                <div className="payment-choice-content">
                  <strong>Pay on Delivery</strong>
                  <span className="pay-subtext">Pay upon physical courier delivery</span>
                </div>
              </label>
            </div>

            {/* UPI Details Box */}
            {paymentMethod === 'UPI' && (
              <div className="payment-details-box">
                <h4 className="detail-box-title">Studio UPI Transfer</h4>
                <p className="detail-box-desc">
                  Scan the studio QR code or transfer directly to Midhun's verified studio VPA.
                </p>

                <div className="upi-qr-row">
                  <div className="upi-qr-box">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=midhunrs@oksbi&pn=Midhun%20RS%20Art%20Studio&am=${order.totalPrice}&cu=INR`}
                      alt="UPI QR Code"
                      className="qr-image"
                    />
                    <span className="qr-caption">Scan with any UPI App</span>
                  </div>

                  <div className="upi-info-col">
                    <div className="vpa-display-block">
                      <span className="vpa-label">Studio UPI ID (VPA):</span>
                      <strong className="vpa-address">midhunrs@oksbi</strong>
                    </div>

                    <div className="form-group-block" style={{ marginTop: '0.75rem' }}>
                      <label className="form-label">Your UPI ID / Reference (Optional)</label>
                      <input
                        type="text"
                        className="form-input-block"
                        placeholder="e.g. yourname@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Card Mock Input Box */}
            {paymentMethod === 'Card' && (
              <div className="payment-details-box">
                <div className="form-group-block">
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    className="form-input-block"
                    placeholder="4111 2222 3333 4444"
                    maxLength="19"
                  />
                </div>
                <div className="form-grid-2col">
                  <div className="form-group-block">
                    <label className="form-label">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      className="form-input-block"
                      placeholder="12/28"
                      maxLength="5"
                    />
                  </div>
                  <div className="form-group-block">
                    <label className="form-label">CVV</label>
                    <input
                      type="password"
                      className="form-input-block"
                      placeholder="•••"
                      maxLength="4"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoicing Summary */}
        <div className="checkout-side-col">
          <div className="summary-sticky-card">
            <h3 className="summary-card-title">Payment Breakdown</h3>
            <div className="gold-accent-line"></div>

            <div className="summary-breakdown-table">
              <div className="breakdown-row">
                <span>Portrait ({order.size})</span>
                <span>₹{order.basePrice?.toLocaleString('en-IN')}</span>
              </div>
              {order.mediumSurcharge > 0 && (
                <div className="breakdown-row">
                  <span>Medium Surcharge</span>
                  <span>+₹{order.mediumSurcharge?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.facesSurcharge > 0 && (
                <div className="breakdown-row">
                  <span>Faces Surcharge</span>
                  <span>+₹{order.facesSurcharge?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.framingPrice > 0 && (
                <div className="breakdown-row">
                  <span>Framing Cost</span>
                  <span>+₹{order.framingPrice?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.expressFee > 0 && (
                <div className="breakdown-row">
                  <span>VIP Priority</span>
                  <span>+₹{order.expressFee?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="breakdown-row">
                <span>Insured Courier</span>
                <span className="text-free-ship">FREE</span>
              </div>

              <div className="breakdown-total-divider"></div>

              <div className="breakdown-row total-row">
                <span className="total-label">Total to Authorize</span>
                <span className="total-amount">₹{order.totalPrice?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-order-continue"
              disabled={processing}
            >
              {processing ? 'Processing Payment & Invoicing...' : `Pay ₹${order.totalPrice?.toLocaleString('en-IN')} Now`}
            </button>

            <div className="checkout-security-badges">
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>📄 Instant PDF Tax Invoice Dispatched</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

