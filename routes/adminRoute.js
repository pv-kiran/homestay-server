const express = require("express");
const router = express.Router();
const { homestayUpload } = require("../utils/multerHelper"); // Ensure correct path

const {
  adminSignUp,
  adminOtpVerify,
  adminLogin,
  adminLogout,
  addCategory,
  updateCategory,
  toggleCategoryStatus,
  getAllCategories,
  addHomestay,
  updateHomestay,
  toggleHomestayStatus,
  getHomestayById,
  getAllHomestays,
  adminResendOtp,
  addAmenities,
  updateAmenity,
  toggleAmenityStatus,
  getAllAmenities,
  getAllUsers,
  getUserById,
  toggleUserStatus,
} = require("../controllers/adminController");
const { authenticateToken } = require("../middleware/authMiddleware");

// router.post('/admin/add-homestay',homestayUpload.fields([
//     { name: 'images', maxCount: 5 },
//     { name: 'amenities[0].icon', maxCount: 1 }
// ]), addHomestay);

// router.post('/admin/add-homestay', homestayUpload.any(), addHomestay);

const fields = [
  { name: "images", maxCount: 5 },
  //   ...Array.from({ length: 10 }, (_, i) => ({
  //     name: `amenities[${i}].icon`,
  //     maxCount: 1,
  //   })),
];

router.post("/auth/signup", adminSignUp);
router.post("/auth/otp/verify", adminOtpVerify);
router.post("/auth/signin", adminLogin);
router.post("/auth/otp/resend", adminResendOtp);
router.post("/auth/logout", adminLogout);
router.post("/add-category", addCategory);
router.put("/edit-category/:categoryId", updateCategory);
router.put("/toggle-category/:categoryId", toggleCategoryStatus);
router.post("/get-allcategories", getAllCategories);
router.post("/add-amenities", addAmenities);
router.put("/edit-amenity/:amenityId", updateAmenity);
router.put("/toggle-amenity/:amenityId", toggleAmenityStatus);
router.post("/get-allamenities", getAllAmenities);

router.post("/add-homestay", homestayUpload.fields(fields), addHomestay);
router.put(
  "/update-homestay/:homestayId",
  homestayUpload.fields(fields),
  updateHomestay
);
router.put("/toggle-homestay/:homestayId", toggleHomestayStatus);
router.get("/get-homestay/:homestayId", getHomestayById);
router.post("/get-allhomestays", getAllHomestays);

router.get("/get-allusers", getAllUsers);
router.get("/get-user/:userId", getUserById);
router.put("/toggle-user/:userId", toggleUserStatus);


module.exports = router;
