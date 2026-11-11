const Artwork = require('../models/Artwork');
const { FALLBACK_ARTWORKS, isUiOnlyShowcaseWithoutDb } = require('../config/fallbackArtworks');

exports.getIndex = async (req, res) => {
  try {
    const category = req.query.category || 'all';

    let artworks;
    let featuredArtworks;

    if (isUiOnlyShowcaseWithoutDb()) {
      const normalizedCategory = category.toLowerCase();
      artworks = (category && normalizedCategory !== 'all')
        ? FALLBACK_ARTWORKS.filter((art) => (art.category || '').toLowerCase() === normalizedCategory)
        : FALLBACK_ARTWORKS;
      featuredArtworks = FALLBACK_ARTWORKS.filter((art) => Number(art.featured) === 1).slice(0, 6);
    } else {
      let query = {};
      if (category && category !== 'all') {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }

      artworks = await Artwork.find(query).sort({ _id: -1 });
      featuredArtworks = await Artwork.find({ featured: 1 }).sort({ _id: -1 }).limit(6);
    }

    const categories = [
      { id: 'all', name: 'All Artworks' },
      { id: 'hyper-realistic', name: 'Hyper-Realistic' },
      { id: 'couple & wedding', name: 'Couple & Wedding' },
      { id: 'celebrity & icons', name: 'Celebrity & Icons' },
      { id: 'pet portraits', name: 'Pet Portraits' },
      { id: 'wildlife & nature', name: 'Wildlife & Nature' }
    ];

    res.render('index', {
      pageTitle: 'Midhun Pencil Portraits | Handcrafted Realistic Fine Art Sketches',
      artworks,
      featuredArtworks,
      categories,
      selectedCategory: category
    });
  } catch (err) {
    console.error('Error in homeController getIndex:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.getArtworkDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const artwork = isUiOnlyShowcaseWithoutDb()
      ? FALLBACK_ARTWORKS.find((art) => String(art._id) === String(id))
      : await Artwork.findById(id);

    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }
    res.json({ success: true, artwork });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
