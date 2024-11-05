const { default: axios } = require("axios");
const User = require("../models/user");
const Homestay = require("../models/homestays");
const Category = require("../models/category");
const { generateOtpEmailTemplate } = require("../templates/otpEmailTemplate");
const { transporter } = require("../utils/emailHelper");
const { getToken } = require("../utils/jwtHelper");
const { getOtpExpiry, generateOtp } = require("../utils/otpHelper");
const {
  validateUserSignup,
  validateOtp,
  userValidationSchema,
} = require("../utils/validationHelper");

const userSignup = async (req, res) => {
  const { error } = validateUserSignup.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.details[0]?.message,
    });
  }
  const { email } = req.body;
  try {
    let userExists = await User.findOne({ email: email });
    let otp = generateOtp();
    let otpExpiry = getOtpExpiry();
    if (userExists) {
      userExists.otp = otp;
      userExists.otpExpiry = otpExpiry;
      await userExists.save();
    } else {
      userExists = await User.create({
        email: email,
        otp: otp,
        otpExpiry: otpExpiry,
      });
    }

    // OTP Send
    const mailOptions = {
      from: "admin@gmail.com",
      to: `${email}`,
      subject: "OTP VERIFICATION",
      html: generateOtpEmailTemplate("User", otp),
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      user: {
        _id: userExists.id,
        email: userExists.email,
      },
      otpExpiry: userExists?.otpExpiry,
      message: "Please check your email for OTP verification.",
    });
  } catch (e) {
    if (e.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid input data" });
    } else if (e.name === "MongoError") {
      return res.status(500).json({ message: "Database error occurred" });
    } else if (e.message.includes("getHashedPassword")) {
      return res.status(500).json({ message: "Error in password hashing" });
    } else if (e.message.includes("sendMail")) {
      return res.status(500).json({ message: "Error sending OTP email" });
    } else {
      return res.status(500).json({ message: "An unexpected error occurred" });
    }
  }
};


const userOtpVerify = async (req, res) => {
  const { error } = validateOtp.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `user doesn't exists with this email`,
      });
    }

    if (parseInt(otp) === user.otp) {
      if (Date.now() < user.otpExpiry) {
        await User.findOneAndUpdate(
          { email: email },
          { $set: { isVerified: true } }
        );
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        const token = await getToken(user._id, email);

        return res.json({
          success: true,
          userDetails: {
            token,
            userId: user?.id,
            email: user?.email,
            accountCreationStatus: user?.accountCreationStatus,
            method: "email-otp",
            name: user?.fullName,
          },
          message: "Signed In",
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "OTP already expired !",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP !",
      });
    }
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }
};

const useResendOtp = async (req, res) => {
  const { error } = validateUserSignup.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.details[0]?.message,
    });
  }

  try {
    const useExists = await User.findOne({ email: req.body?.email });
    if (!useExists) {
      return res.status(400).json({
        message: "Email ID doesn't exists!",
        isVerified: useExists.isVerified,
      });
    }
    const otp = generateOtp();
    const otpExpiry = getOtpExpiry();
    useExists.otp = otp;
    useExists.otpExpiry = otpExpiry;
    await useExists.save();
    const mailOptions = {
      from: "admin@gmail.com",
      to: `${req.body?.email}`,
      subject: "OTP VERIFICATION",
      html: generateOtpEmailTemplate(req.body?.email, otp),
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: "A new OTP has been sent to your email.",
      admin: {
        _id: useExists._id,
        email: useExists.email,
      },
      otpExpiry: useExists.otpExpiry,
      isVerified: useExists.isVerified,
    });
  } catch (err) {
    console.log(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid input data" });
    } else if (err.name === "MongoError") {
      return res.status(500).json({ message: "Database error occurred" });
    } else if (err.message.includes("sendMail")) {
      return res.status(500).json({ message: "Error sending OTP email" });
    } else {
      return res.status(500).json({ message: "An unexpected error occurred" });
    }
  }
};

const googleSignIn = async (req, res) => {
  try {
    const { access_token } = req.body;

    // 1. Verify the token and get user info server-side
    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    // 2. Verify token validity
    const tokenInfoResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${access_token}`
    );

    // 3. Verify that the token was intended for your application
    if (tokenInfoResponse.data.audience !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: "Invalid token audience" });
    }

    const userInfo = userInfoResponse.data;

    // 4. Find or create user with rate limiting
    let user = await User.findOne({ email: userInfo.email });

    if (!user) {
      // Add rate limiting for new user creation
      const newUserCount = await User.countDocuments({
        createdAt: { $gt: new Date(Date.now() - 3600000) }, // Last hour
      });

      if (newUserCount > 100) {
        // Adjust limit as needed
        return res.status(429).json({ message: "Too many new accounts" });
      }

      user = new User({
        email: userInfo?.email,
        fullName: userInfo?.name,
      });
      await user.save();
    }

    const token = await getToken(user?._id, userInfo?.email);

    return res.json({
      success: true,
      userDetails: {
        token,
        userId: user?.id,
        email: user?.email,
        name: user?.fullName,
        accountCreationStatus: user?.accountCreationStatus,
        method: "google-auth",
      },
      message: "Signed In",
    });
  } catch (error) {
    // 7. Proper error handling with appropriate status codes
    if (error.response?.status === 401) {
      return res.status(401).json({ message: "Invalid token" });
    }

    res.status(500).json({ message: "Authentication failed" });
  }
};

const userAccountCreation = async (req, res) => {
  const { userId } = req.params;
  const { fullName, email, dob, isMarketingAllowed } = req.body;

  // Validate request body
  const { error } = userValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    // Convert dob from string to Date object if present
    const parsedDob = dob ? new Date(dob) : undefined;

    // Update the user with the parsed date
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          fullName: fullName,
          email: email,
          dob: parsedDob,
          isMarketingAllowed: isMarketingAllowed,
          accountCreationStatus: true,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const userLogout = async (req, res) => {
  try {
    // Clear the token cookie by setting it to an empty string and expiring immediately
    res.cookie("token", "", {
      expires: new Date(0), // Expire immediately
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
    });

    return res.status(200).json({
      success: true,
      message: "Admin Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred during logout",
    });
  }
};

//USER - GET ALL HOMESTAYS
const getAllHomestays = async (req, res) => {
  try {
      const homestays = await Homestay.find()
          .select('-createdAt') 
          .populate({
              path: 'category',
              match: { isDisabled: false } 
          })
          .populate("amenities");

      // Filter out homestays with no category or disabled category
      const filteredHomestays = homestays.filter(homestay => homestay.category !== null);

      if (!filteredHomestays.length) {
          return res.status(404).json({
              success: false,
              message: 'No homestays found'
          });
      }

      return res.status(200).json({
          success: true,
          data: filteredHomestays
      });
  } catch (error) {
      console.error('Error retrieving homestays:', error);
      return res.status(500).json({
          success: false,
          message: 'An error occurred while retrieving homestays'
      });
  }
};

//USER - GET ALL CATEGORIES
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDisabled: false });

    if (!categories.length) {
      return res.status(404).json({
        success: false,
        message: "No categories found",
      });
    }

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error retrieving categories:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving categories",
    });
  }
};


module.exports = {
  userSignup,
  userOtpVerify,
  googleSignIn,
  userAccountCreation,
  useResendOtp,
  userLogout,
  getAllHomestays,
  getAllCategories,
};
