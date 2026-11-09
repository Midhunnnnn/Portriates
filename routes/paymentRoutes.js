const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/checkout/:orderNumber', paymentController.getCheckout);
router.post('/process/:orderNumber', paymentController.postProcessPayment);

module.exports = router;
