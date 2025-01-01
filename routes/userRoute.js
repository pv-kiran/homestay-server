const express = require("express");
const {
  userSignup,
  userOtpVerify,
  googleSignIn,
  userAccountCreation,
  userLogout,
  useResendOtp,
  getAllHomestays,
  getAllCategories,
  getHomestayById,
  getAvailableHomestayAddresses,
  bookHomestay,
  getUserById,
  updateUserData,
  updateProPic,
  getValidCoupons,
  applyCoupon,
  getLatestValidCoupon,
  bookHomestayComplete,
  getUserBookings,
  markAsCheckedIn,
  markAsCheckedOut,
  markAsCancelled,
  checkFutureBooking,
  submitReview,
  getReviewsByHomestay,
  generateReceipt,
} = require("../controllers/userController");

const { authenticateToken, isUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/auth/signin", userSignup);
router.post("/auth/otp/verify", userOtpVerify);
router.post("/auth/otp/resend", useResendOtp);
router.post("/auth/google/signin", googleSignIn);
router.put("/account/setup/complete/:userId", userAccountCreation);
router.get("/auth/signout", userLogout);
router.post("/auth/update-profile", authenticateToken, updateUserData);
router.get("/auth/view-profile", authenticateToken, getUserById);
router.put("/auth/update-propic", authenticateToken, updateProPic);
router.get("/auth/view-profile", authenticateToken, getUserById)

router.post("/get-allhomestays", getAllHomestays);
router.get("/homestay/:homestayId/:currency", getHomestayById);
router.get("/get-allcategories", getAllCategories);
router.get("/get-all-locations", getAvailableHomestayAddresses);


router.post("/book/homestay", authenticateToken, isUser, bookHomestay);
router.post("/book/homestay/complete", authenticateToken, isUser, bookHomestayComplete);
router.get("/homestay/my-bookings", authenticateToken, isUser, getUserBookings);

router.patch('/homestay/checkin/:bookingId', authenticateToken, isUser, markAsCheckedIn);
router.patch('/homestay/checkout/:bookingId', authenticateToken, isUser, markAsCheckedOut);
router.patch('/homestay/cancel/:bookingId', authenticateToken, isUser, markAsCancelled);

router.get('/homestay/booking/:homeStayId/status', authenticateToken, isUser, checkFutureBooking);

router.get("/get-coupons", authenticateToken, isUser, getValidCoupons);
router.post("/apply-coupon", authenticateToken, isUser, applyCoupon);
router.get("/get-latestcoupon", getLatestValidCoupon);

router.post("/submit-review", authenticateToken, isUser, submitReview);
router.get("/test/:homeStayId", getReviewsByHomestay);

router.get("/download-receipt/:bookingId", authenticateToken, isUser, generateReceipt);


module.exports = router;

