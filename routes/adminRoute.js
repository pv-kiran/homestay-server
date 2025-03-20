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

router.post("/get-allusers", getAllUsers);
router.get("/get-user/:userId", getUserById);
router.put("/toggle-user/:userId", toggleUserStatus);
router.post("/get-allbookings", getAllBookings);
router.put("/homestay/:id/images", reorderImages);

router.post("/add-coupon", createCoupon);
router.put("/update-coupon/:id", updateCoupon);
router.put("/toggle-coupon/:id", toggleCouponStatus);
router.post("/get-allcoupons", getAllCoupons);

router.get("/month/report", getMonthlyReport);
router.get("/yearly/report", getYearlyReport);
router.get("/homestay/report", getHomeStaywiseReport);
router.get("/category/report", getCategoryWiseReport);
router.get("/overall/report", getOverallReport);


router.post("/add-restaurent", addRestaurent);
router.post("/get-restaurents", getAllRestaurants);
router.put('/restaurant/:id', updateRestaurant);

router.post("/add-homelyfood", addHomelyFood);
router.post("/get-homelyfoods", getAllHomelyFood);
router.put('/homelyfood/:id', updateHomelyFood);


router.post("/add-roomservice", addRoomService);
router.post("/get-roomservice", getRoomServices);
router.put('/roomservice/:id', updateRoomService);

router.post("/add-rides", addRides);
router.post("/get-rides", getRides);
router.put('/ride/:id', updateRides);


router.post("/add-entertainment", addEntertainment);
router.post("/get-entertainment", getEntertainment);
router.put('/entertainment/:id', updateEntertainment);

router.post("/add-otherservice", addOtherService);
router.post("/get-otherservice", getOtherService);
router.put('/otherservice/:id', updateOtherService);

router.get("/homestay/allservice", getAllServices);
router.put("/homestay/allservice/:id", updateHomeStayAddOns);
router.put("/booking/refund/:id", initiateRefund);

router.put("/update-idcontrol", updateIdProofControl);
router.get("/get-idstatus", getIdProofMandatoryStatus);

router.put("/cancellation-policy/:homestayId", updateCancellationPolicy);

module.exports = router;
