const express = require('express');
const router = express.Router();

const { adminSignUp, adminOtpVerify, adminLogin } = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/super/admin/signup', adminSignUp);
router.post('/super/admin/otp/verify', adminOtpVerify);
router.post('/admin/login', adminLogin);


module.exports = router;