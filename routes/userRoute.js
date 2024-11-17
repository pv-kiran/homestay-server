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
  getAvailableHomestayDistricts,
} = require("../controllers/userController");
const router = express.Router();

router.post("/auth/signin", userSignup);
router.post("/auth/otp/verify", userOtpVerify);
router.post("/auth/otp/resend", useResendOtp);
router.post("/auth/google/signin", googleSignIn);
router.put("/account/setup/complete/:userId", userAccountCreation);
router.get("/auth/signout", userLogout);

router.get("/get-allhomestays", getAllHomestays);
router.get("/get-allcategories", getAllCategories);
router.get("/get-all-locations", getAvailableHomestayDistricts);




module.exports = router;
