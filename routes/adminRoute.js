const express = require('express');
const router = express.Router();

const { adminSignUp, adminOtpVerify, adminLogin, addCategory, updateCategory, disableCategory } = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/auth/signup', adminSignUp);
router.post('/auth/otp/verify', adminOtpVerify);
router.post('/auth/signin', adminLogin);
router.post('/add-category', addCategory);
router.put('/edit-category/:categoryId', updateCategory);
router.put('/disable-category/:categoryId', disableCategory);





module.exports = router;