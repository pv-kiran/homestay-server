const express = require('express');
const router = express.Router();
const { homestayUpload } = require('../utils/multerHelper'); // Ensure correct path


const { adminSignUp, adminOtpVerify, adminLogin, addCategory, updateCategory, toggleCategory, addHomestay, updateHomestay } = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/super/admin/signup', adminSignUp);
router.post('/super/admin/otp/verify', adminOtpVerify);
router.post('/admin/signin', adminLogin);
router.post('/admin/add-category', addCategory);
router.put('/admin/edit-category/:categoryId', updateCategory);
router.put('/admin/toggle-category/:categoryId', toggleCategory);
// router.post('/admin/add-homestay',homestayUpload.fields([
//     { name: 'images', maxCount: 5 },
//     { name: 'amenities[0].icon', maxCount: 1 }
// ]), addHomestay);

// router.post('/admin/add-homestay', homestayUpload.any(), addHomestay);

const fields = [
    { name: 'images', maxCount: 5 },
    ...Array.from({ length: 10 }, (_, i) => ({ name: `amenities[${i}].icon`, maxCount: 1 }))
];

router.post('/admin/add-homestay', homestayUpload.fields(fields), addHomestay);
router.put('/admin/update-homestay/:homestayId', homestayUpload.fields(fields), updateHomestay);









module.exports = router;