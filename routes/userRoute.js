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
  getAvailableHomestayDistricts,
  getUserById,
  updateUserData,
} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/auth/signin", userSignup);
router.post("/auth/otp/verify", userOtpVerify);
router.post("/auth/otp/resend", useResendOtp);
router.post("/auth/google/signin", googleSignIn);
router.put("/account/setup/complete/:userId", userAccountCreation);
router.get("/auth/signout", userLogout);
router.post("/auth/update-profile", authenticateToken, updateUserData);
router.get("/auth/view-profile", authenticateToken, getUserById )

router.post("/get-allhomestays", getAllHomestays);
router.get("/homestay/:homestayId", getHomestayById);
router.get("/get-allcategories", getAllCategories);
router.get("/get-all-locations", getAvailableHomestayDistricts);


module.exports = router;

