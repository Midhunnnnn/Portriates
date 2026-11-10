import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../config/api';

const CATEGORIES = [
  'Hyper-Realistic',
  'Couple & Wedding',
  'Celebrity & Icons',
  'Pet Portraits',
  'Wildlife & Nature',
  'Fine Art Portrait'
];

export default function AdminArtworks() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Artwork form state
  const [newArt, setNewArt] = useState({
    title: '',
    category: 'Hyper-Realistic',
    price: '',
    dimensions: 'A3 (11.7 x 16.5 in)',
    medium: 'Graphite Pencil',
    description: '',
    featured: false
  });
  const [artFile, setArtFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const res = await apiFetch('/api/admin/artworks');
      const data = await res.json();
      if (res.ok && data.success) {
        setArtworks(data.artworks || []);
      } else {
        setError(data.message || 'Failed to load artworks');
      }
    } catch (err) {
      setError('Error communicating with artwork database');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewArt((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArtFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddArtwork = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newArt.title || !newArt.price || !artFile) {
      setError('Please provide artwork title, price, and select an artwork image file.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('image', artFile);
      payload.append('title', newArt.title);
      payload.append('category', newArt.category);
      payload.append('price', newArt.price);
      payload.append('dimensions', newArt.dimensions);
      payload.append('medium', newArt.medium);
      payload.append('description', newArt.description);
      payload.append('featured', newArt.featured);

      const res = await apiFetch('/api/admin/artworks/add', {
        method: 'POST',
        body: payload
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add artwork');
      }

      setSuccess(`Artwork "${newArt.title}" has been published to the gallery!`);
      // Reset form
      setNewArt({
        title: '',
        category: 'Hyper-Realistic',
        price: '',
        dimensions: 'A3 (11.7 x 16.5 in)',
        medium: 'Graphite Pencil',
        description: '',
        featured: false
      });
      setArtFile(null);
      setFilePreview(null);
      fetchArtworks();
    } catch (err) {
      setError(err.message || 'Error publishing artwork');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (artworkId, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the live portfolio?`)) {
      return;
    }

    try {
      const res = await apiFetch('/api/admin/artworks/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Artwork "${title}" has been removed.`);
        setArtworks((prev) => prev.filter((a) => (a._id !== artworkId && a.id !== artworkId)));
      } else {
        setError(data.message || 'Could not delete artwork');
      }
    } catch (err) {
      setError('Error deleting artwork');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header-block">
        <div className="admin-header-left">
          <Link to="/admin" className="admin-back-breadcrumb">
            &larr; Back to Dashboard
          </Link>
          <h1 className="admin-page-title">Gallery Artworks Manager</h1>
          <p className="admin-welcome-sub">
            Upload new pencil portraits to your public portfolio, update pricing & specs, or edit existing pieces.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link to="/admin/orders" className="btn-admin-nav">
            Manage Commissions
          </Link>
          <Link to="/" className="btn-admin-nav btn-admin-primary">
            View Public Gallery
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

      <div className="admin-artworks-layout">
        {/* Left Side: Upload New Artwork Form */}
        <div className="add-artwork-card-block">
          <h3 className="admin-card-title">Upload New Portfolio Piece</h3>
          <div className="gold-accent-line"></div>
          <p className="card-sub-hint">
            Add your newest pencil or charcoal drawing with high-res photograph and collector details.
          </p>

          <form onSubmit={handleAddArtwork} className="add-art-form">
            <div className="form-group-block">
              <label className="form-label">Artwork Title *</label>
              <input
                type="text"
                name="title"
                className="form-input-block"
                placeholder="e.g. Soul of the Matriarch"
                value={newArt.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-grid-2col">
              <div className="form-group-block">
                <label className="form-label">Category *</label>
                <select
                  name="category"
                  className="form-input-block"
                  value={newArt.category}
                  onChange={handleInputChange}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-block">
                <label className="form-label">Price (INR) *</label>
                <input
                  type="number"
                  name="price"
                  className="form-input-block"
                  placeholder="e.g. 4500"
                  value={newArt.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-group-block">
                <label className="form-label">Medium *</label>
                <input
                  type="text"
                  name="medium"
                  className="form-input-block"
                  placeholder="e.g. Graphite Pencil / Charcoal"
                  value={newArt.medium}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group-block">
                <label className="form-label">Dimensions *</label>
                <input
                  type="text"
                  name="dimensions"
                  className="form-input-block"
                  placeholder="e.g. A3 (11.7 x 16.5 in)"
                  value={newArt.dimensions}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group-block">
              <label className="form-label">Artwork Description</label>
              <textarea
                name="description"
                rows="3"
                className="form-textarea-block"
                placeholder="Provide artistic notes on technique, lighting, inspiration, or paper used."
                value={newArt.description}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="form-group-block">
              <label className="checkbox-label-block">
                <input
                  type="checkbox"
                  name="featured"
                  checked={newArt.featured}
                  onChange={handleInputChange}
                  className="form-checkbox-custom"
                />
                <span>Feature in Hero Showcase</span>
              </label>
            </div>

            {/* Artwork File Upload */}
            <div className="form-group-block">
              <label className="form-label">Artwork Photograph *</label>
              <div className="upload-dropzone-block">
                <input
                  type="file"
                  id="new-art-file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                />
                <label htmlFor="new-art-file" className="dropzone-label">
                  {filePreview ? (
                    <div className="preview-container">
                      <img src={filePreview} alt="Preview" className="preview-image" />
                      <span className="btn-change-photo">Change Photo</span>
                    </div>
                  ) : (
                    <div className="dropzone-idle">
                      <span className="upload-title">Select Artwork Image</span>
                      <span className="upload-sub">High resolution photograph of the drawing</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={submitting}
            >
              {submitting ? 'Publishing to Gallery...' : 'Publish Artwork to Portfolio'}
            </button>
          </form>
        </div>

        {/* Right Side: Live Gallery Inventory & Edit Actions */}
        <div className="artworks-inventory-col">
          <div className="inventory-header-row">
            <h3 className="admin-card-title">Live Portfolio Pieces ({artworks.length})</h3>
            <span className="inventory-note">You can edit every detail or replace image of any piece</span>
          </div>

          {loading ? (
            <div className="loading-state-block">
              <p>Loading studio artworks...</p>
            </div>
          ) : artworks.length === 0 ? (
            <div className="empty-state-block">
              <p>No artworks in portfolio yet. Upload your first drawing using the form on the left.</p>
            </div>
          ) : (
            <div className="admin-artworks-grid">
              {artworks.map((art) => (
                <div key={art._id || art.id} className="admin-art-card">
                  <div className="admin-art-thumb-box">
                    <img
                      src={art.image_url || '/images/hero-portrait.jpg'}
                      alt={art.title}
                      className="admin-art-thumb"
                    />
                    {art.featured && (
                      <span className="featured-chip-block">Featured</span>
                    )}
                  </div>

                  <div className="admin-art-body">
                    <div className="card-top-meta">
                      <span className="block-category-tag">{art.category}</span>
                      <span className="admin-art-price">
                        ₹{Number(art.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <h4 className="admin-art-title">{art.title}</h4>
                    <div className="admin-art-specs">
                      <span>{art.dimensions}</span>
                      <span>•</span>
                      <span>{art.medium}</span>
                    </div>

                    {art.description && (
                      <p className="admin-art-desc-preview">
                        {art.description.length > 80 ? art.description.slice(0, 80) + '...' : art.description}
                      </p>
                    )}

                    <div className="admin-art-actions-row">
                      {/* Edit Button - user specifically requested ability to edit everything! */}
                      <Link
                        to={`/admin/artworks/edit/${art._id || art.id}`}
                        className="btn-edit-artwork-block"
                      >
                        Edit Everything
                      </Link>

                      <button
                        onClick={() => handleDelete(art._id || art.id, art.title)}
                        className="btn-delete-artwork-block"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

