const express = require('express');
const router = express.Router();

const { adminSignUp, adminOtpVerify, adminLogin, addCategory, updateCategory, disableCategory } = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/super/admin/signup', adminSignUp);
router.post('/super/admin/otp/verify', adminOtpVerify);
router.post('/admin/signin', adminLogin);
router.post('/admin/add-category', addCategory);
router.put('/admin/edit-category/:categoryId', updateCategory);
router.put('/admin/disable-category/:categoryId', disableCategory);





module.exports = router;