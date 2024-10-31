const express = require('express');
const router = express.Router();

const { adminSignUp, adminOtpVerify, adminLogin } = require('../controllers/auth');

router.post('/super/admin/signup', adminSignUp);
router.post('/super/admin/otp/verify', adminOtpVerify );
router.post('/admin/login', adminLogin );


module.exports = router;