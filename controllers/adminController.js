const Order = require('../models/Order');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const { transporter } = require('../config/mailer');
const { resolveUploadedArtworkUrl } = require('../middleware/uploadMiddleware');
const { safeDeleteUnusedArtworkAsset } = require('../config/cloudinary');

exports.getDashboard = async (req, res) => {
  try {
    const stats = await Order.getDashboardStats();
    const recentOrders = await Order.find().sort({ created_at: -1 }).limit(8);
    const artworksCount = await Artwork.countDocuments();
    const usersCount = await User.countDocuments();

    res.render('admin/dashboard', {
      pageTitle: 'Artist Admin Control Center | Midhun Pencil Portraits',
      stats,
      recentOrders,
      artworksCount,
      usersCount,
      adminEmail: process.env.ADMIN_EMAIL || 'midhunrs727@gmail.com',
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Server Error');
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    res.render('admin/orders', {
      pageTitle: 'Manage Commissions & Client Orders | Admin',
      orders,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    res.status(500).send('Server Error');
  }
};

exports.postUpdateOrderStatus = async (req, res) => {
  try {
    const { orderId, order_status } = req.body;
    await Order.findByIdAndUpdate(orderId, { order_status });
    res.redirect('/admin/orders?success=Order status updated successfully');
  } catch (err) {
    console.error('Error updating order status:', err);
    res.redirect('/admin/orders?error=Failed to update order status');
  }
};

exports.getArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find().sort({ _id: -1 });
    res.render('admin/artworks', {
      pageTitle: 'Manage Portfolio & Gallery Artworks | Admin',
      artworks,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('Error fetching admin artworks:', err);
    res.status(500).send('Server Error');
  }
};

exports.postAddArtwork = async (req, res) => {
  try {
    const { title, category, medium, size, price, description, featured } = req.body;

    if (!title || !category || !price) {
      return res.redirect('/admin/artworks?error=Title, category, and price are required.');
    }

    let imageUrl = '/images/samples/portrait_1_hyperrealistic.svg';
    if (req.file) {
      imageUrl = await resolveUploadedArtworkUrl(req.file, 'artworks');
    }

    await Artwork.create({
      title: title.trim(),
      category: category.trim(),
      medium: medium || 'Graphite & Charcoal',
      size: size || 'A3 (11.7 x 16.5 in)',
      price: parseFloat(price) || 2500,
      description: description || '',
      image_url: imageUrl,
      featured: (featured === 'on' || featured === '1') ? 1 : 0
    });

    res.redirect('/admin/artworks?success=New portrait sketch successfully added to your showcase gallery!');
  } catch (err) {
    console.error('Error adding artwork:', err);
    res.redirect('/admin/artworks?error=Failed to upload artwork: ' + err.message);
  }
};

exports.postDeleteArtwork = async (req, res) => {
  try {
    const { id } = req.body;
    const deletedArtwork = await Artwork.findByIdAndDelete(id);
    if (deletedArtwork && deletedArtwork.image_url) {
      await safeDeleteUnusedArtworkAsset(Artwork, deletedArtwork.image_url, deletedArtwork._id);
    }
    res.redirect('/admin/artworks?success=Artwork removed from portfolio');
  } catch (err) {
    console.error('Error deleting artwork:', err);
    res.redirect('/admin/artworks?error=Failed to delete artwork');
  }
};

exports.getEditArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    const artwork = await Artwork.findById(id);

    if (!artwork) {
      return res.redirect('/admin/artworks?error=Artwork not found.');
    }

    res.render('admin/edit-artwork', {
      pageTitle: `Edit Artwork: ${artwork.title} | Admin`,
      artwork,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('Error fetching artwork for edit:', err);
    res.redirect('/admin/artworks?error=Failed to retrieve artwork.');
  }
};

exports.postEditArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, medium, size, price, description, featured } = req.body;

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return res.redirect('/admin/artworks?error=Artwork not found.');
    }

    if (!title || !category || !price) {
      return res.redirect(`/admin/artworks/edit/${id}?error=Title, category, and price are required.`);
    }

    const previousImageUrl = artwork.image_url;
    let uploadedNewImageUrl = null;

    artwork.title = title.trim();
    artwork.category = category.trim();
    artwork.medium = medium ? medium.trim() : artwork.medium;
    artwork.size = size || artwork.size;
    artwork.price = parseFloat(price) || artwork.price;
    artwork.description = description !== undefined ? description.trim() : artwork.description;
    artwork.featured = (featured === 'on' || featured === '1') ? 1 : 0;

    // Replace photo if new file uploaded
    if (req.file) {
      uploadedNewImageUrl = await resolveUploadedArtworkUrl(req.file, 'artworks');
      artwork.image_url = uploadedNewImageUrl;
    }

    await artwork.save();
    if (uploadedNewImageUrl && previousImageUrl && previousImageUrl !== uploadedNewImageUrl) {
      await safeDeleteUnusedArtworkAsset(Artwork, previousImageUrl, artwork._id);
    }

    res.redirect('/admin/artworks?success=Portrait artwork updated successfully!');
  } catch (err) {
    console.error('Error updating artwork:', err);
    res.redirect(`/admin/artworks/edit/${req.params.id}?error=Update failed: ${encodeURIComponent(err.message)}`);
  }
};

exports.testMailerConnection = async (req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection verified successfully with midhunrs727@gmail.com!' });
  } catch (err) {
    res.json({ success: false, message: 'SMTP verification failed: ' + err.message });
  }
};
