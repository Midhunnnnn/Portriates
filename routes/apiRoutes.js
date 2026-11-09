const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { uploadOrderPhoto, uploadArtworkImage } = require('../middleware/uploadMiddleware');

// Auth Routes
router.get('/auth/me', apiController.getCurrentUser);
router.post('/auth/register', apiController.postRegister);
router.post('/auth/verify-otp', apiController.postVerifyOtp);
router.post('/auth/resend-otp', apiController.postResendOtp);
router.post('/auth/login', apiController.postLogin);
router.post('/auth/admin-login', apiController.postAdminLogin);
router.post('/auth/logout', apiController.postLogout);

// Artworks / Showcase Routes
router.get('/artworks', apiController.getArtworks);
router.get('/artworks/:id', apiController.getArtworkById);

// Order Commission Routes
router.get('/orders/calculate-price', apiController.getCalculatePrice);
router.post('/orders/give-order', uploadOrderPhoto.single('reference_photo'), apiController.postCreateOrder);
router.get('/orders/my-orders', apiController.getMyOrders);
router.get('/orders/:orderNumber', apiController.getOrderByNumber);

// Payment Routes
router.post('/payment/process/:orderNumber', apiController.postProcessPayment);

// Billing & Receipt Routes
router.get('/billing/receipt/:orderNumber', apiController.getOrderByNumber);
router.get('/billing/receipt/:orderNumber/download-pdf', apiController.downloadReceiptPdf);
router.post('/billing/receipt/:orderNumber/resend-email', apiController.postResendReceiptEmail);

// Admin Routes
router.get('/admin/dashboard', apiController.getAdminDashboard);
router.get('/admin/orders', apiController.getAdminOrders);
router.post('/admin/orders/update-status', apiController.postAdminUpdateOrderStatus);
router.get('/admin/artworks', apiController.getAdminArtworks);
router.post('/admin/artworks/add', uploadArtworkImage.single('artwork_image'), apiController.postAdminAddArtwork);
router.get('/admin/artworks/:id', apiController.getArtworkById);
router.post('/admin/artworks/edit/:id', uploadArtworkImage.single('artwork_image'), apiController.postAdminEditArtwork);
router.post('/admin/artworks/delete', apiController.postAdminDeleteArtwork);
router.get('/admin/test-email', apiController.getAdminTestEmail);

module.exports = router;

