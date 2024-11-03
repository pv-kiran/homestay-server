const express = require('express');
const router = express.Router();
const { homestayUpload } = require('../utils/multerHelper'); // Ensure correct path


const { adminSignUp, adminOtpVerify, adminLogin, addCategory, updateCategory, toggleCategoryStatus, addHomestay, updateHomestay, toggleHomestayStatus } = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');


// router.post('/admin/add-homestay',homestayUpload.fields([
//     { name: 'images', maxCount: 5 },
//     { name: 'amenities[0].icon', maxCount: 1 }
// ]), addHomestay);

// router.post('/admin/add-homestay', homestayUpload.any(), addHomestay);

const fields = [
    { name: 'images', maxCount: 5 },
    ...Array.from({ length: 10 }, (_, i) => ({ name: `amenities[${i}].icon`, maxCount: 1 }))
];

router.post('/auth/signup', adminSignUp);
router.post('/auth/otp/verify', adminOtpVerify);
router.post('/auth/signin', adminLogin);
router.post('/add-category', addCategory);
router.put('/edit-category/:categoryId', updateCategory);
router.put('/toggle-category/:categoryId', toggleCategoryStatus);

router.post('/add-homestay', homestayUpload.fields(fields), addHomestay);
router.put('/update-homestay/:homestayId', homestayUpload.fields(fields), updateHomestay);
router.put('/toggle-homestay/:homestayId', toggleHomestayStatus);








module.exports = router;