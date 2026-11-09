import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Studio Profile */}
          <div className="footer-col brand-col">
            <h3 className="footer-brand-title">MIDHUN</h3>
            <p className="footer-brand-tagline">Fine Art Pencil & Charcoal Portraits</p>
            <p className="footer-desc">
              Bespoke, handcrafted hyper-realistic portraits created with archival German graphite,
              willow charcoal, and 300 GSM hot-pressed cotton paper. Designed to last generations.
            </p>
            <div className="footer-contact-item">
              <span className="contact-label">Studio Email:</span>
              <span className="contact-val">midhunrs727@gmail.com</span>
            </div>
            <div className="footer-contact-item">
              <span className="contact-label">Location:</span>
              <span className="contact-val">Kerala, India — Insured Pan-India & Global Dispatch</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Portfolio & Works</h4>
            <ul className="footer-links-list">
              <li><Link to="/#rates">Commission Rates</Link></li>
              <li><Link to="/#workflow">Artisan Process</Link></li>
              <li><Link to="/give-order">Give Your Order</Link></li>
              <li><Link to="/#artist">About Midhun R S</Link></li>
            </ul>
          </div>

          {/* Collector Services */}
          <div className="footer-col">
            <h4 className="footer-heading">Collector Care</h4>
            <ul className="footer-links-list">
              <li><Link to="/my-orders">Track Commission</Link></li>
              <li><Link to="/login">Client Portal</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/admin/login">Artist Portal</Link></li>
            </ul>
          </div>

          {/* Quality Guarantee */}
          <div className="footer-col">
            <h4 className="footer-heading">Archival Standards</h4>
            <div className="archival-badge-box">
              <div className="archival-item">
                <strong>100% Cotton Rag Paper</strong>
                <span>Acid-free, 300 GSM cold/hot press</span>
              </div>
              <div className="archival-item">
                <strong>UV-Protective Seal</strong>
                <span>Dual-layer fixative prevents smudging</span>
              </div>
              <div className="archival-item">
                <strong>Insured Safe Delivery</strong>
                <span>Reinforced impact-proof casing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright-text">
            &copy; {new Date().getFullYear()} Midhun R S. All Rights Reserved. Handcrafted Pencil Portrait Artistry.
          </div>
          <div className="footer-bottom-links">
            <span>Secure 256-Bit SSL Checkout</span>
            <span className="divider-dot">•</span>
            <span>Tax Invoicing & Receipts</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

