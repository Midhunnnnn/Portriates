const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.get('/receipt/:orderNumber', billingController.getReceipt);
router.get('/receipt/:orderNumber/download-pdf', billingController.downloadReceiptPDF);
router.post('/receipt/:orderNumber/resend-email', billingController.resendReceiptEmail);

module.exports = router;
