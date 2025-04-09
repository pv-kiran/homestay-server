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
  updateCoupon,
  createCoupon,
  toggleCouponStatus,
  getAllCoupons,
  getAllBookings,
  reorderImages,
  getMonthlyReport,
  getHomeStaywiseReport,
  getCategoryWiseReport,
  getYearlyReport,
  getOverallReport,
  addRestaurent,
  getAllRestaurants,
  updateRestaurant,
  addHomelyFood,
  getAllHomelyFood,
  updateHomelyFood,
  addRoomService,
  getRoomServices,
  updateRoomService,
  addRides,
  getRides,
  updateRides,
  addEntertainment,
  getEntertainment,
  updateEntertainment,
  addOtherService,
  getOtherService,
  updateOtherService,
  getAllServices,
  updateHomeStayAddOns,
  initiateRefund,
  getIdProofMandatoryStatus,
  updateIdProofControl,
  updateCancellationPolicy,
} = require("../controllers/adminController");
const { authenticateToken, isAdmin } = require("../middleware/authMiddleware");

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
router.post("/add-category", authenticateToken, isAdmin, addCategory);
router.put("/edit-category/:categoryId", authenticateToken, isAdmin, updateCategory);
router.put("/toggle-category/:categoryId", authenticateToken, isAdmin, toggleCategoryStatus);
router.post("/get-allcategories", authenticateToken, isAdmin, getAllCategories);
router.post("/add-amenities", authenticateToken, isAdmin, addAmenities);
router.put("/edit-amenity/:amenityId", authenticateToken, isAdmin, updateAmenity);
router.put("/toggle-amenity/:amenityId", authenticateToken, isAdmin, toggleAmenityStatus);
router.post("/get-allamenities", authenticateToken, isAdmin, getAllAmenities);

router.post("/add-homestay", authenticateToken, isAdmin, homestayUpload.fields(fields), addHomestay);
router.put(
  "/update-homestay/:homestayId",
  authenticateToken, isAdmin,
  homestayUpload.fields(fields),
  updateHomestay
);
router.put("/toggle-homestay/:homestayId", authenticateToken, isAdmin, toggleHomestayStatus);
router.get("/get-homestay/:homestayId", authenticateToken, isAdmin, getHomestayById);
router.post("/get-allhomestays", getAllHomestays);

router.post("/get-allusers", authenticateToken, isAdmin, getAllUsers);
router.get("/get-user/:userId", authenticateToken, isAdmin, getUserById);
router.put("/toggle-user/:userId", authenticateToken, isAdmin, toggleUserStatus);
router.post("/get-allbookings", authenticateToken, isAdmin, getAllBookings);
router.put("/homestay/:id/images", authenticateToken, isAdmin, reorderImages);

router.post("/add-coupon", authenticateToken, isAdmin, createCoupon);
router.put("/update-coupon/:id", authenticateToken, isAdmin, updateCoupon);
router.put("/toggle-coupon/:id", authenticateToken, isAdmin, toggleCouponStatus);
router.post("/get-allcoupons", getAllCoupons);

router.get("/month/report", authenticateToken, isAdmin, getMonthlyReport);
router.get("/yearly/report", authenticateToken, isAdmin, getYearlyReport);
router.get("/homestay/report", authenticateToken, isAdmin, getHomeStaywiseReport);
router.get("/category/report", authenticateToken, isAdmin, getCategoryWiseReport);
router.get("/overall/report", authenticateToken, isAdmin, getOverallReport);


router.post("/add-restaurent", authenticateToken, isAdmin, addRestaurent);
router.post("/get-restaurents", authenticateToken, isAdmin, getAllRestaurants);
router.put('/restaurant/:id', authenticateToken, isAdmin, updateRestaurant);

router.post("/add-homelyfood", authenticateToken, isAdmin, addHomelyFood);
router.post("/get-homelyfoods", authenticateToken, isAdmin, getAllHomelyFood);
router.put('/homelyfood/:id', authenticateToken, isAdmin, updateHomelyFood);


router.post("/add-roomservice", authenticateToken, isAdmin, addRoomService);
router.post("/get-roomservice", authenticateToken, isAdmin, getRoomServices);
router.put('/roomservice/:id', authenticateToken, isAdmin, updateRoomService);

router.post("/add-rides", authenticateToken, isAdmin, addRides);
router.post("/get-rides", authenticateToken, isAdmin, getRides);
router.put('/ride/:id', authenticateToken, isAdmin, updateRides);


router.post("/add-entertainment", authenticateToken, isAdmin, addEntertainment);
router.post("/get-entertainment", authenticateToken, isAdmin, getEntertainment);
router.put('/entertainment/:id', authenticateToken, isAdmin, updateEntertainment);

router.post("/add-otherservice", authenticateToken, isAdmin, addOtherService);
router.post("/get-otherservice", authenticateToken, isAdmin, getOtherService);
router.put('/otherservice/:id', authenticateToken, isAdmin, updateOtherService);

router.get("/homestay/allservice", authenticateToken, isAdmin, getAllServices);
router.put("/homestay/allservice/:id", authenticateToken, isAdmin, updateHomeStayAddOns);
router.put("/booking/refund/:id", authenticateToken, isAdmin, initiateRefund);

router.put("/update-idcontrol", authenticateToken, isAdmin, updateIdProofControl);
router.get("/get-idstatus", authenticateToken, isAdmin, getIdProofMandatoryStatus);

router.put("/cancellation-policy/:homestayId", authenticateToken, isAdmin, updateCancellationPolicy);

module.exports = router;
