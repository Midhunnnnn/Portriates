const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  medium: {
    type: String,
    default: 'Graphite Pencil'
  },
  size: {
    type: String,
    default: 'A3 (11.7 x 16.5 in)'
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  image_url: {
    type: String,
    required: true
  },
  featured: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Virtual for id string (useful for EJS templates)
artworkSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
artworkSchema.set('toJSON', { virtuals: true });
artworkSchema.set('toObject', { virtuals: true });

const Artwork = mongoose.model('Artwork', artworkSchema);
module.exports = Artwork;
