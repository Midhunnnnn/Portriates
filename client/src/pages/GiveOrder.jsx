import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIZES = [
  { id: 'A4 (8.3 x 11.7 in)', name: 'A4 Canvas', dims: '8.3 x 11.7 in / 21 x 29.7 cm', basePrice: 2499 },
  { id: 'A3 (11.7 x 16.5 in)', name: 'A3 Canvas (Recommended)', dims: '11.7 x 16.5 in / 29.7 x 42 cm', basePrice: 4199 },
  { id: 'A2 (16.5 x 23.4 in)', name: 'A2 Canvas (Grand)', dims: '16.5 x 23.4 in / 42 x 59.4 cm', basePrice: 6999 }
];

const MEDIUMS = [
  { id: 'Graphite Pencil', name: 'Pure German Graphite (Classical Silver Shading)', surcharge: 0 },
  { id: 'Charcoal & Graphite Blend', name: 'Charcoal & Graphite Hybrid (Dramatic Contrast)', surcharge: 400 },
  { id: 'Colored Pencil Accent', name: 'Selective Color Tint (e.g. Eyes/Jewelry/Florals)', surcharge: 800 },
  { id: 'White Charcoal on Black', name: 'White Charcoal on Fine Black Cotton Paper', surcharge: 900 }
];

const FRAMING_OPTIONS = [
  { id: 'Unframed (Protective Tube)', name: 'Unframed (Rolled in Hardboard Archival Postal Tube)', price: 0 },
  { id: 'Museum Teak Frame', name: 'Museum Teak Wood Frame + Acrylic Glass', price: 1200 },
  { id: 'Minimalist Matte Black Frame', name: 'Minimalist Matte Black Contemporary Frame', price: 1000 },
  { id: 'Antique Gold Baroque Frame', name: 'Antique Museum Gold Baroque Frame', price: 1800 }
];

export default function GiveOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialSize = searchParams.get('size') || 'A3 (11.7 x 16.5 in)';
  const initialMedium = searchParams.get('medium') || 'Charcoal & Graphite Blend';

  const [formData, setFormData] = useState({
    size: initialSize,
    medium: initialMedium,
    faces: 1,
    framing: 'Unframed (Protective Tube)',
    isExpress: false,
    specialInstructions: '',
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    shippingAddress: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || ''
  });

  const [referenceFile, setReferenceFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pricing, setPricing] = useState({
    basePrice: 4199,
    facesSurcharge: 0,
    mediumSurcharge: 400,
    framingPrice: 0,
    expressFee: 0,
    shippingFee: 0,
    subtotal: 4599,
    tax: 0,
    total: 4599
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update client contact info if user logs in or profile changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || user.name || '',
        customerEmail: prev.customerEmail || user.email || '',
        customerPhone: prev.customerPhone || user.phone || '',
        shippingAddress: prev.shippingAddress || user.address || '',
        city: prev.city || user.city || '',
        state: prev.state || user.state || '',
        pincode: prev.pincode || user.pincode || ''
      }));
    }
  }, [user]);

  // Recalculate price dynamically whenever choices change
  useEffect(() => {
    calculatePrice();
  }, [formData.size, formData.medium, formData.faces, formData.framing, formData.isExpress]);

  const calculatePrice = async () => {
    try {
      const res = await fetch('/api/orders/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size: formData.size,
          medium: formData.medium,
          faces: formData.faces,
          framing: formData.framing,
          isExpress: formData.isExpress
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPricing(data.pricing);
      }
    } catch (err) {
      console.error('Price calculation error:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReferenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!referenceFile) {
      setError('Please upload a reference photograph for the pencil portrait.');
      return;
    }

    if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress) {
      setError('Please complete the delivery details so we can deliver your portrait.');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('referencePhoto', referenceFile);
      payload.append('size', formData.size);
      payload.append('medium', formData.medium);
      payload.append('faces', formData.faces);
      payload.append('framing', formData.framing);
      payload.append('isExpress', formData.isExpress);
      payload.append('specialInstructions', formData.specialInstructions);
      payload.append('customerName', formData.customerName);
      payload.append('customerEmail', formData.customerEmail);
      payload.append('customerPhone', formData.customerPhone);
      payload.append('shippingAddress', formData.shippingAddress);
      payload.append('city', formData.city);
      payload.append('state', formData.state);
      payload.append('pincode', formData.pincode);

      const res = await fetch('/api/orders/give-order', {
        method: 'POST',
        body: payload
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to place commission request');
      }

      // Navigate to checkout/payment page
      navigate(`/checkout/${data.order.orderNumber}`);
    } catch (err) {
      setError(err.message || 'Error submitting order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-page-container">
      <div className="order-page-header">
        <span className="order-eyebrow">BESPOKE HAND-CRAFTED ARTISTRY</span>
        <h1 className="order-main-heading">Give Your Portrait Order</h1>
        <div className="gold-accent-line"></div>
        <p className="order-subtext">
          Customize every facet of your portrait — from canvas scale and artistic medium to archival framing.
          Your reference photo is hand-drawn stroke-by-stroke by Midhun R S.
        </p>
      </div>

      {error && (
        <div className="alert-box-block alert-error order-alert-box">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="order-layout-grid">
        {/* Left Column: Customization Specs */}
        <div className="order-specs-col">
          {/* Step 1: Canvas Dimensions */}
          <div className="spec-card-block">
            <div className="spec-step-header">
              <span className="spec-step-num">01</span>
              <div>
                <h3 className="spec-step-title">Select Canvas Dimension</h3>
                <p className="spec-step-subtitle">All dimensions crafted on 300 GSM Fabriano acid-free paper</p>
              </div>
            </div>

            <div className="options-selector-grid">
              {SIZES.map((size) => (
                <label
                  key={size.id}
                  className={`option-choice-block ${formData.size === size.id ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="size"
                    value={size.id}
                    checked={formData.size === size.id}
                    onChange={handleInputChange}
                    className="hidden-radio"
                  />
                  <div className="choice-content">
                    <span className="choice-name">{size.name}</span>
                    <span className="choice-dims">{size.dims}</span>
                    <span className="choice-price">₹{size.basePrice.toLocaleString('en-IN')} base</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 2: Artistic Medium */}
          <div className="spec-card-block">
            <div className="spec-step-header">
              <span className="spec-step-num">02</span>
              <div>
                <h3 className="spec-step-title">Choose Artistic Medium</h3>
                <p className="spec-step-subtitle">High-grade Staedtler German graphite & European charcoal</p>
              </div>
            </div>

            <div className="options-selector-vertical">
              {MEDIUMS.map((med) => (
                <label
                  key={med.id}
                  className={`option-choice-block option-row ${formData.medium === med.id ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="medium"
                    value={med.id}
                    checked={formData.medium === med.id}
                    onChange={handleInputChange}
                    className="hidden-radio"
                  />
                  <div className="choice-row-content">
                    <span className="choice-name">{med.name}</span>
                    <span className="choice-surcharge">
                      {med.surcharge > 0 ? `+ ₹${med.surcharge}` : 'Included in base'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 3: Number of Faces / Subjects */}
          <div className="spec-card-block">
            <div className="spec-step-header">
              <span className="spec-step-num">03</span>
              <div>
                <h3 className="spec-step-title">Subjects & Faces</h3>
                <p className="spec-step-subtitle">Single portrait, couples, or multi-subject heirloom</p>
              </div>
            </div>

            <div className="faces-selector-grid">
              {[
                { count: 1, label: 'Single Face', note: 'Included' },
                { count: 2, label: '2 Faces (Couple)', note: '+40% craftsmanship' },
                { count: 3, label: '3+ Faces (Family)', note: '+80% craftsmanship' }
              ].map((face) => (
                <label
                  key={face.count}
                  className={`option-choice-block ${Number(formData.faces) === face.count ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="faces"
                    value={face.count}
                    checked={Number(formData.faces) === face.count}
                    onChange={handleInputChange}
                    className="hidden-radio"
                  />
                  <div className="choice-content text-center">
                    <span className="choice-name">{face.label}</span>
                    <span className="choice-note">{face.note}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 4: Framing & Presentation */}
          <div className="spec-card-block">
            <div className="spec-step-header">
              <span className="spec-step-num">04</span>
              <div>
                <h3 className="spec-step-title">Framing & Presentation</h3>
                <p className="spec-step-subtitle">Arrives ready to hang on your wall or in rolled tube</p>
              </div>
            </div>

            <div className="options-selector-vertical">
              {FRAMING_OPTIONS.map((frame) => (
                <label
                  key={frame.id}
                  className={`option-choice-block option-row ${formData.framing === frame.id ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="framing"
                    value={frame.id}
                    checked={formData.framing === frame.id}
                    onChange={handleInputChange}
                    className="hidden-radio"
                  />
                  <div className="choice-row-content">
                    <span className="choice-name">{frame.name}</span>
                    <span className="choice-surcharge">
                      {frame.price > 0 ? `+ ₹${frame.price.toLocaleString('en-IN')}` : 'Included'}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {/* Express Delivery Option */}
            <div className="express-toggle-box">
              <label className="checkbox-label-block">
                <input
                  type="checkbox"
                  name="isExpress"
                  checked={formData.isExpress}
                  onChange={handleInputChange}
                  className="form-checkbox-custom"
                />
                <div>
                  <strong>VIP Priority Express Dispatch (+₹800)</strong>
                  <p className="hint-desc">Pushed to top of Midhun's drawing schedule; completed in 3-4 days.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Step 5: Reference Photo Upload */}
          <div className="spec-card-block">
            <div className="spec-step-header">
              <span className="spec-step-num">05</span>
              <div>
                <h3 className="spec-step-title">Upload Reference Photograph</h3>
                <p className="spec-step-subtitle">Higher resolution ensures finer micro-textures and eye reflections</p>
              </div>
            </div>

            <div className="upload-dropzone-block">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden-file-input"
              />
              <label htmlFor="photo-upload" className="dropzone-label">
                {imagePreview ? (
                  <div className="preview-container">
                    <img src={imagePreview} alt="Reference Preview" className="preview-image" />
                    <span className="btn-change-photo">Change Selected Photograph</span>
                  </div>
                ) : (
                  <div className="dropzone-idle">
                    <span className="upload-title">Click to Select or Drop Photograph</span>
                    <span className="upload-sub">Supports JPG, PNG, WEBP up to 25MB</span>
                  </div>
                )}
              </label>
            </div>

            <div className="form-group-block" style={{ marginTop: '1.25rem' }}>
              <label htmlFor="specialInstructions" className="form-label">
                Artistic Notes & Custom Preferences
              </label>
              <textarea
                id="specialInstructions"
                name="specialInstructions"
                rows="3"
                className="form-textarea-block"
                placeholder="e.g. Please emphasize the eyes, omit the busy background, combine two different reference photos, or write a custom dedication."
                value={formData.specialInstructions}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>

          {/* Step 6: Recipient & Delivery Address */}
          <div className="spec-card-block">
            <div className="spec-step-header">
              <span className="spec-step-num">06</span>
              <div>
                <h3 className="spec-step-title">Delivery Address & Contact</h3>
                <p className="spec-step-subtitle">Where should Midhun ship your completed pencil artwork?</p>
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group-block">
                <label className="form-label">Recipient Full Name *</label>
                <input
                  type="text"
                  name="customerName"
                  className="form-input-block"
                  placeholder="Full Name"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group-block">
                <label className="form-label">Email (for digital proof & invoice) *</label>
                <input
                  type="email"
                  name="customerEmail"
                  className="form-input-block"
                  placeholder="name@domain.com"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group-block">
              <label className="form-label">Contact / WhatsApp Phone Number *</label>
              <input
                type="tel"
                name="customerPhone"
                className="form-input-block"
                placeholder="+91 98765 43210"
                value={formData.customerPhone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group-block">
              <label className="form-label">Shipping Street Address *</label>
              <textarea
                name="shippingAddress"
                rows="2"
                className="form-textarea-block"
                placeholder="Flat / House No., Building Name, Street, Landmark"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            <div className="form-grid-3col">
              <div className="form-group-block">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  name="city"
                  className="form-input-block"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group-block">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  name="state"
                  className="form-input-block"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group-block">
                <label className="form-label">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  className="form-input-block"
                  placeholder="e.g. 695001"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Price Breakdown & Summary */}
        <div className="order-summary-col">
          <div className="summary-sticky-card">
            <h3 className="summary-card-title">Commission Summary</h3>
            <div className="gold-accent-line"></div>

            <div className="summary-specs-recap">
              <div className="recap-row">
                <span className="recap-label">Canvas Dimension</span>
                <span className="recap-val">{formData.size}</span>
              </div>
              <div className="recap-row">
                <span className="recap-label">Medium</span>
                <span className="recap-val">{formData.medium}</span>
              </div>
              <div className="recap-row">
                <span className="recap-label">Subjects</span>
                <span className="recap-val">{formData.faces} {Number(formData.faces) === 1 ? 'Subject' : 'Subjects'}</span>
              </div>
              <div className="recap-row">
                <span className="recap-label">Framing</span>
                <span className="recap-val">{formData.framing}</span>
              </div>
              {formData.isExpress && (
                <div className="recap-row">
                  <span className="recap-label">Turnaround</span>
                  <span className="recap-val" style={{ color: 'var(--gold-primary)' }}>VIP Express Priority</span>
                </div>
              )}
            </div>

            <div className="summary-breakdown-table">
              <div className="breakdown-row">
                <span>Base Portrait</span>
                <span>₹{pricing.basePrice.toLocaleString('en-IN')}</span>
              </div>
              {pricing.mediumSurcharge > 0 && (
                <div className="breakdown-row">
                  <span>Medium Formulation</span>
                  <span>+₹{pricing.mediumSurcharge.toLocaleString('en-IN')}</span>
                </div>
              )}
              {pricing.facesSurcharge > 0 && (
                <div className="breakdown-row">
                  <span>Additional Faces</span>
                  <span>+₹{pricing.facesSurcharge.toLocaleString('en-IN')}</span>
                </div>
              )}
              {pricing.framingPrice > 0 && (
                <div className="breakdown-row">
                  <span>Archival Framing</span>
                  <span>+₹{pricing.framingPrice.toLocaleString('en-IN')}</span>
                </div>
              )}
              {pricing.expressFee > 0 && (
                <div className="breakdown-row">
                  <span>VIP Priority</span>
                  <span>+₹{pricing.expressFee.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="breakdown-row">
                <span>Insured Courier Delivery</span>
                <span className="text-free-ship">FREE Pan-India</span>
              </div>

              <div className="breakdown-total-divider"></div>

              <div className="breakdown-row total-row">
                <span className="total-label">Total Investment</span>
                <span className="total-amount">₹{pricing.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="summary-guarantees-list">
              <div className="guarantee-item">
                <span>✓ High-Resolution Proof Before Dispatch</span>
              </div>
              <div className="guarantee-item">
                <span>✓ 100% Hand-Sketched by Artist Midhun R S</span>
              </div>
              <div className="guarantee-item">
                <span>✓ Official Tax Invoice & PDF Certificate</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-order-continue"
              disabled={loading}
            >
              {loading ? 'Processing Commission...' : `Proceed to Payment (₹${pricing.total.toLocaleString('en-IN')})`}
            </button>
            <p className="order-note-micro">
              You will inspect and authorize payment on the next screen.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

