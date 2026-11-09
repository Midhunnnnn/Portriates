const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/verify-otp', authController.getVerifyOtp);
router.post('/verify-otp', authController.postVerifyOtp);
router.post('/resend-otp', authController.postResendOtp);

router.get('/admin-login', authController.getAdminLogin);
router.post('/admin-login', authController.postAdminLogin);

router.get('/logout', authController.logout);

module.exports = router;
