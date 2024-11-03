const express = require('express');
const { userSignup, userOtpVerify, googleSignIn, userAccountCreation } = require('../controllers/userController');
const router = express.Router();



router.post('/auth/signin', userSignup);
router.post('/auth/otp/verify', userOtpVerify);
router.post('/auth/google/signin', googleSignIn);
router.put('/account/setup/complete/:userId', userAccountCreation);



module.exports = router;