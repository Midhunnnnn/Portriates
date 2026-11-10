import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../config/api';

const CATEGORIES = [
  'Hyper-Realistic',
  'Couple & Wedding',
  'Celebrity & Icons',
  'Pet Portraits',
  'Wildlife & Nature',
  'Fine Art Portrait'
];

export default function AdminEditArtwork() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Hyper-Realistic',
    price: '',
    dimensions: '',
    medium: '',
    description: '',
    featured: false
  });
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchArtworkDetails();
  }, [id]);

  const fetchArtworkDetails = async () => {
    try {
      const res = await apiFetch(`/api/admin/artworks/${id}`);
      const data = await res.json();
      if (res.ok && data.success && data.artwork) {
        const art = data.artwork;
        setFormData({
          title: art.title || '',
          category: art.category || 'Hyper-Realistic',
          price: art.price || '',
          dimensions: art.dimensions || '',
          medium: art.medium || '',
          description: art.description || '',
          featured: Boolean(art.featured)
        });
        setExistingImageUrl(art.image_url || '');
      } else {
        setError(data.message || 'Artwork not found');
      }
    } catch (err) {
      setError('Failed to load artwork for editing');
    } finally {
      setLoading(false);
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
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.price || !formData.dimensions || !formData.medium) {
      setError('Please provide all mandatory fields (Title, Price, Medium, Dimensions).');
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('category', formData.category);
      payload.append('price', formData.price);
      payload.append('dimensions', formData.dimensions);
      payload.append('medium', formData.medium);
      payload.append('description', formData.description);
      payload.append('featured', formData.featured);

      if (newImageFile) {
        payload.append('image', newImageFile);
      }

      const res = await apiFetch(`/api/admin/artworks/edit/${id}`, {
        method: 'POST',
        body: payload
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save changes');
      }

      setSuccess('All artwork details have been successfully updated!');
      setTimeout(() => {
        navigate('/admin/artworks');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Error updating artwork');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="loading-state-block">
          <p>Loading artwork editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-header-block">
        <div className="admin-header-left">
          <Link to="/admin/artworks" className="admin-back-breadcrumb">
            &larr; Back to Artworks Manager
          </Link>
          <h1 className="admin-page-title">Edit Artwork Details</h1>
          <p className="admin-welcome-sub">
            Modify every detail entered during upload time, update pricing, change category, or upload an updated photograph.
          </p>
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

      <div className="edit-artwork-container-card">
        <form onSubmit={handleSubmit} className="edit-art-form-layout">
          <div className="edit-art-main-col">
            <div className="form-group-block">
              <label className="form-label">Artwork Title *</label>
              <input
                type="text"
                name="title"
                className="form-input-block"
                value={formData.title}
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
                  value={formData.category}
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
                  value={formData.price}
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
                  value={formData.medium}
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
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group-block">
              <label className="form-label">Artwork Description</label>
              <textarea
                name="description"
                rows="4"
                className="form-textarea-block"
                value={formData.description}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="form-group-block">
              <label className="checkbox-label-block">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="form-checkbox-custom"
                />
                <span>Feature in Hero Showcase</span>
              </label>
            </div>
          </div>

          <div className="edit-art-media-col">
            <h4 className="form-label" style={{ marginBottom: '0.75rem' }}>
              Artwork Photograph
            </h4>

            {/* Current or Newly Previewed Image */}
            <div className="artwork-preview-wrapper">
              <img
                src={newImagePreview || existingImageUrl || '/images/hero-portrait.jpg'}
                alt="Artwork Preview"
                className="edit-artwork-display-img"
              />
              <span className="preview-indicator-badge">
                {newImagePreview ? 'New Image Selected' : 'Current Published Photo'}
              </span>
            </div>

            <div className="form-group-block" style={{ marginTop: '1rem' }}>
              <label className="form-label">Replace Photograph (Optional)</label>
              <input
                type="file"
                id="replace-art-file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden-file-input"
              />
              <label htmlFor="replace-art-file" className="btn-select-new-photo">
                Choose New Image File
              </label>
              <p className="field-hint-text">
                Leave unchanged to keep the existing published photograph.
              </p>
            </div>

            <div className="edit-form-actions-box">
              <button
                type="submit"
                className="btn-auth-submit"
                disabled={saving}
              >
                {saving ? 'Saving Changes...' : 'Save All Changes'}
              </button>

              <Link to="/admin/artworks" className="btn-cancel-edit">
                Cancel & Return
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

