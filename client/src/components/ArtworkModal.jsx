import React from 'react';
import { Link } from 'react-router-dom';

export default function ArtworkModal({ artwork, onClose }) {
  if (!artwork) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-block-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
          &times;
        </button>

        <div className="modal-grid">
          <div className="modal-image-col">
            <img
              src={artwork.image_url || '/images/samples/catpencil.jpg'}
              alt={artwork.title}
              className="modal-full-img"
            />
          </div>

          <div className="modal-details-col">
            <div className="block-category-tag">
              {artwork.category || 'Fine Art Portrait'}
            </div>

            <h2 className="modal-title">{artwork.title}</h2>
            <p className="modal-price">₹{Number(artwork.price || 0).toLocaleString('en-IN')}</p>

            <div className="modal-specs-table">
              <div className="spec-row">
                <span className="spec-label">Medium</span>
                <span className="spec-value">{artwork.medium || 'Archival Graphite & Charcoal'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Dimensions</span>
                <span className="spec-value">{artwork.size || artwork.dimensions || 'A3 (11.7 x 16.5 in)'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Paper</span>
                <span className="spec-value">Fabriano 300 GSM 100% Cotton Rag</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Finish</span>
                <span className="spec-value">Krylon UV-Resistant Matte Fixative</span>
              </div>
            </div>

            <div className="modal-desc-box">
              <p>{artwork.description || 'Masterwork hand-drawn by Midhun R S with exquisite attention to tonal depth, micro-textures, and emotional resonance.'}</p>
            </div>

            <div className="modal-actions-box">
              <Link
                to={`/give-order?medium=${encodeURIComponent(artwork.medium || 'Graphite Pencil')}&size=${encodeURIComponent(artwork.size || artwork.dimensions || 'A3 (11.7 x 16.5 in)')}`}
                className="btn-modal-order"
                onClick={onClose}
              >
                Commission a Similar Portrait
              </Link>
              <button className="btn-modal-back" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

