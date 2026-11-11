import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArtworkModal from '../components/ArtworkModal';
import PencilCat3D from '../components/PencilCat3D';
import { API_BASE_URL, apiFetch } from '../config/api';
import { FALLBACK_ARTWORKS } from '../data/fallbackArtworks';

const CATEGORIES = [
  'All',
  'Hyper-Realistic',
  'Couple & Wedding',
  'Celebrity & Icons',
  'Pet Portraits',
  'Wildlife & Nature'
];

export default function Home() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeArtwork, setActiveArtwork] = useState(null);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    if (import.meta.env.PROD && !API_BASE_URL) {
      setArtworks(FALLBACK_ARTWORKS);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/artworks');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.artworks)) {
          setArtworks(data.artworks);
          return;
        }
      }
      setArtworks(FALLBACK_ARTWORKS);
    } catch (err) {
      console.error('Error fetching artworks:', err);
      setArtworks(FALLBACK_ARTWORKS);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtworks = selectedCategory === 'All'
    ? artworks
    : artworks.filter((item) => item.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="home-page-container">
      {/* Hero Section with Interactive 3D Pencil Cat */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              MASTER ARTISAN STUDIO — BESPOKE COMMISSIONS
            </div>
            <h1 className="hero-title">
              Hyper-Realistic Hand-Drawn Pencil Portraits
            </h1>
            <p className="hero-lead">
              Every portrait is an heirloom crafted by <strong>Midhun R S</strong> using premium German graphite,
              deep willow charcoal, and acid-free 300 GSM cotton rag. Unmatched tonal range, lifelike human expression,
              and archival permanence.
            </p>

            <div className="hero-cta-group">
              <Link to="/give-order" className="btn-hero-primary">
                Give Your Order
              </Link>
              <a href="#gallery" className="btn-hero-secondary">
                View Master Gallery
              </a>
            </div>

            <div className="hero-metrics-bar">
              <div className="metric-block">
                <span className="metric-number">350+</span>
                <span className="metric-label">Portraits Commissioned</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-block">
                <span className="metric-number">100%</span>
                <span className="metric-label">Handcrafted by Midhun</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-block">
                <span className="metric-number">300 GSM</span>
                <span className="metric-label">Archival Cotton Rag</span>
              </div>
            </div>
          </div>

          {/* Interactive 3D Pencil-Drawn Cat Showcase Frame */}
          <div className="hero-visual-col">
            <PencilCat3D />
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="gallery-section">
        <div className="section-header-block">
          <span className="section-label">ORIGINAL SKETCHES & MASTERPIECES</span>
          <h2 className="section-title">The Curated Portfolio</h2>
          <div className="gold-accent-line"></div>
          <p className="section-subtext">
            Explore our diverse collection of human realism, cinematic lighting, and detailed graphite portraiture.
          </p>
        </div>

        {/* Clean Rectangular Category Blocks (NO PILLS / CAPSULES) */}
        <div className="category-filter-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-block-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Artwork Grid */}
        {loading ? (
          <div className="loading-state-block">
            <p>Loading masterworks from the studio archive...</p>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="empty-state-block">
            <p>No pieces currently displayed in this category.</p>
            <button onClick={() => setSelectedCategory('All')} className="btn-reset-filter">
              View All Works
            </button>
          </div>
        ) : (
          <div className="artworks-grid">
            {filteredArtworks.map((artwork) => (
              <div
                key={artwork._id || artwork.id}
                className="artwork-card-block"
                onClick={() => setActiveArtwork(artwork)}
              >
                <div className="artwork-card-media">
                  <img
                    src={artwork.image_url || '/images/hero-portrait.jpg'}
                    alt={artwork.title}
                    loading="lazy"
                  />
                  <div className="artwork-hover-overlay">
                    <span className="view-details-tag">Inspect Artwork</span>
                  </div>
                </div>

                <div className="artwork-card-body">
                  <div className="card-top-meta">
                    <span className="block-category-tag">{artwork.category}</span>
                    <span className="card-medium-label">{artwork.medium}</span>
                  </div>

                  <h3 className="card-artwork-title">{artwork.title}</h3>

                  <div className="card-bottom-row">
                    <div className="card-size-label">{artwork.size || artwork.dimensions}</div>
                    <div className="card-price-tag">
                      ₹{Number(artwork.price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Commission Rates & Dimensions */}
      <section id="rates" className="rates-section">
        <div className="section-header-block">
          <span className="section-label">TRANSPARENT ARTISAN PRICING</span>
          <h2 className="section-title">Commission Dimensions & Rates</h2>
          <div className="gold-accent-line"></div>
          <p className="section-subtext">
            Choose your canvas dimension. All commissions include archival sealing and certificates of authenticity.
          </p>
        </div>

        <div className="rates-cards-grid">
          {/* A4 Tier */}
          <div className="rate-card-block">
            <div className="rate-card-header">
              <span className="rate-dim-badge">Standard Fine Art</span>
              <h3 className="rate-size-title">A4 Dimension</h3>
              <p className="rate-measurements">8.3 x 11.7 Inches (21 x 29.7 cm)</p>
            </div>
            <div className="rate-pricing-box">
              <span className="rate-currency">₹</span>
              <span className="rate-amount">2,499</span>
              <span className="rate-period">Single Subject</span>
            </div>
            <ul className="rate-features-list">
              <li>High-precision graphite detail</li>
              <li>300 GSM Fabriano Cotton Rag</li>
              <li>Estimated 5-7 working days</li>
              <li>Dual-coat protective fixative</li>
              <li>Ships in hardboard reinforced tube</li>
            </ul>
            <Link
              to="/give-order?size=A4 (8.3 x 11.7 in)"
              className="btn-select-rate"
            >
              Commission A4 Portrait
            </Link>
          </div>

          {/* A3 Tier - Featured */}
          <div className="rate-card-block rate-card-featured">
            <div className="featured-banner-block">MOST POPULAR CHOICE</div>
            <div className="rate-card-header">
              <span className="rate-dim-badge">Collector's Choice</span>
              <h3 className="rate-size-title">A3 Dimension</h3>
              <p className="rate-measurements">11.7 x 16.5 Inches (29.7 x 42 cm)</p>
            </div>
            <div className="rate-pricing-box">
              <span className="rate-currency">₹</span>
              <span className="rate-amount">4,199</span>
              <span className="rate-period">Single Subject</span>
            </div>
            <ul className="rate-features-list">
              <li>Exceptional micro-tonal depth</li>
              <li>Deep charcoal and graphite blend</li>
              <li>Ideal for couples & wedding memories</li>
              <li>Estimated 7-10 working days</li>
              <li>Includes Certificate of Authenticity</li>
            </ul>
            <Link
              to="/give-order?size=A3 (11.7 x 16.5 in)"
              className="btn-select-rate-featured"
            >
              Commission A3 Portrait
            </Link>
          </div>

          {/* A2 Tier */}
          <div className="rate-card-block">
            <div className="rate-card-header">
              <span className="rate-dim-badge">Grand Exhibition</span>
              <h3 className="rate-size-title">A2 Dimension</h3>
              <p className="rate-measurements">16.5 x 23.4 Inches (42 x 59.4 cm)</p>
            </div>
            <div className="rate-pricing-box">
              <span className="rate-currency">₹</span>
              <span className="rate-amount">6,999</span>
              <span className="rate-period">Single Subject</span>
            </div>
            <ul className="rate-features-list">
              <li>Monumental presence & full background shading</li>
              <li>Multiple faces & elaborate compositions</li>
              <li>Estimated 12-15 working days</li>
              <li>VIP priority scheduling by Midhun</li>
              <li>Delivered in custom wooden box</li>
            </ul>
            <Link
              to="/give-order?size=A2 (16.5 x 23.4 in)"
              className="btn-select-rate"
            >
              Commission A2 Portrait
            </Link>
          </div>
        </div>
      </section>

      {/* Artisan Workflow Section */}
      <section id="workflow" className="workflow-section">
        <div className="section-header-block">
          <span className="section-label">HOW WE WORK</span>
          <h2 className="section-title">The 4-Step Artisan Workflow</h2>
          <div className="gold-accent-line"></div>
          <p className="section-subtext">
            From your reference photo to a timeless, framed pencil masterpiece delivered to your doorstep.
          </p>
        </div>

        <div className="workflow-steps-grid">
          <div className="workflow-step-block">
            <div className="step-number-box">01</div>
            <h4 className="step-title">Photo Consultation</h4>
            <p className="step-desc">
              Upload your photo during order submission. Midhun personally inspects resolution, lighting, and composition
              to suggest the best tonal medium.
            </p>
          </div>

          <div className="workflow-step-block">
            <div className="step-number-box">02</div>
            <h4 className="step-title">Hand-Penciling</h4>
            <p className="step-desc">
              Over 20–40 hours of meticulous hand-sketching. Multiple layers of H to 8B graphite build velvety shadows,
              delicate skin highlights, and realistic texture.
            </p>
          </div>

          <div className="workflow-step-block">
            <div className="step-number-box">03</div>
            <h4 className="step-title">Digital Proof Approval</h4>
            <p className="step-desc">
              We send you a high-resolution preview of the finished sketch. You review the portrait and can request fine
              refinements before final sealing.
            </p>
          </div>

          <div className="workflow-step-block">
            <div className="step-number-box">04</div>
            <h4 className="step-title">Sealing & Dispatch</h4>
            <p className="step-desc">
              Dual UV protective seal prevents oxidation and fading. Carefully framed in museum-grade wood or packed in heavy
              postal tubes with tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Artist Profile */}
      <section id="artist" className="artist-profile-section">
        <div className="artist-card-grid">
          <div className="artist-image-block">
            <img
              src="/uploads/artworks/artwork-1793110997088-186258819.jpg"
              alt="Midhun R S - Master Pencil Artist"
              className="artist-portrait-photo"
            />
            <div className="artist-caption-block">
              Original hand-drawn graphite portrait by Midhun R S.
            </div>
          </div>

          <div className="artist-bio-block">
            <span className="section-label">THE ARTIST BEHIND THE PENCIL</span>
            <h2 className="artist-name">Midhun R S</h2>
            <div className="gold-accent-line"></div>
            <p className="artist-lead-quote">
              "A photograph freezes time, but a hand-drawn pencil portrait captures the soul, tenderness, and enduring legacy of a moment."
            </p>
            <p className="artist-story-text">
              Midhun is a dedicated pencil and charcoal portrait artist with over 8 years of discipline in classical realism.
              Rejecting digital shortcuts, every stroke is placed by hand on archival cotton paper using professional tools
              including Staedtler Mars Lumograph, Faber-Castell 9000, and Koh-I-Noor charcoal.
            </p>
            <p className="artist-story-text">
              His work has been commissioned by clients across India and internationally for weddings, anniversaries,
              memorial tributes, and celebrity tributes.
            </p>

            <div className="artist-guarantee-row">
              <div className="guarantee-block">
                <strong>100% Hand-Crafted</strong>
                <span>Never printed or digitally traced</span>
              </div>
              <div className="guarantee-block">
                <strong>Archival Grade</strong>
                <span>Lasts 100+ years without yellowing</span>
              </div>
            </div>

            <div className="artist-action-box">
              <Link to="/give-order" className="btn-artist-order">
                Start Your Custom Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {activeArtwork && (
        <ArtworkModal
          artwork={activeArtwork}
          onClose={() => setActiveArtwork(null)}
        />
      )}
    </div>
  );
}

