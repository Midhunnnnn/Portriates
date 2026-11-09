const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { uploadOrderPhoto } = require('../middleware/uploadMiddleware');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/give-order', orderController.getGiveOrder);
router.post('/give-order', uploadOrderPhoto.single('reference_photo'), orderController.postGiveOrder);
router.get('/my-orders', isAuthenticated, orderController.getMyOrders);
router.get('/api/calculate-price', orderController.apiCalculatePrice);

module.exports = router;
