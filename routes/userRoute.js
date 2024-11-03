const express = require('express');
const { userSignup, userOtpVerify } = require('../controllers/userController');
const router = express.Router();



router.post('/auth/signin', userSignup);
router.post('/auth/otp/verify', userOtpVerify);





module.exports = router;