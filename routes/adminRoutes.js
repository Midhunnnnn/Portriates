const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');
const { uploadArtworkImage } = require('../middleware/uploadMiddleware');

// Protect all admin routes
router.use(isAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/orders', adminController.getOrders);
router.post('/orders/update-status', adminController.postUpdateOrderStatus);

router.get('/artworks', adminController.getArtworks);
router.post('/artworks/add', uploadArtworkImage.single('artwork_image'), adminController.postAddArtwork);
router.get('/artworks/edit/:id', adminController.getEditArtwork);
router.post('/artworks/edit/:id', uploadArtworkImage.single('artwork_image'), adminController.postEditArtwork);
router.post('/artworks/delete', adminController.postDeleteArtwork);

router.get('/test-email', adminController.testMailerConnection);

module.exports = router;
