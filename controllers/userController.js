const { default: axios } = require("axios");
const User = require("../models/user");
const Homestay = require("../models/homestays");
const Category = require("../models/category");
const Coupon = require("../models/coupon");
const { generateOtpEmailTemplate } = require("../templates/otpEmailTemplate");
const { transporter } = require("../utils/emailHelper");
const { getToken } = require("../utils/jwtHelper");
const { getOtpExpiry, generateOtp } = require("../utils/otpHelper");
const {
  validateUserSignup,
  validateOtp,
  userValidationSchema,
  validateHomestayId,
  validateUserUpdate,
  validateApplyCoupon,
} = require("../utils/validationHelper");
const Booking = require("../models/booking");
const { cloudinary } = require("../utils/cloudinaryHelper");
const { upload } = require("../utils/multerHelper");

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


// const getAllHomestays = async (req, res) => {
//   try {
//     const { category, price, numberOfGuest, numberOfRooms, numberOfBathrooms, city, currency } = req.body;


//     // Build the filter object dynamically
//     const filter = {};

//     // Category filter
//     if (category && category.length > 0) {
//       filter.category = { $in: category };
//     }

//     // Price range filter
//     if (price && price.length === 2) {
//       filter.pricePerNight = {
//         $gte: price[0],
//         $lte: price[1],
//       };
//     }

//     // Number of guests filter (get homestays that can accommodate >= specified guests)
//     if (numberOfGuest) {
//       filter.maxGuests = { $gte: numberOfGuest };
//     }

//     // Number of rooms filter (get homestays with >= specified rooms)
//     if (numberOfRooms) {
//       filter.noOfRooms = { $gte: numberOfRooms };
//     }

//     // Number of bathrooms filter (get homestays with >= specified bathrooms)
//     if (numberOfBathrooms) {
//       filter.noOfBathRooms = { $gte: numberOfBathrooms };
//     }

//     // City filter (filter homestays by city in the address)
//     if (city) {
//       filter['address.city'] = { $in: city };
//     }

//     // Ensure non-disabled homestays
//     filter.isDisabled = false;

//     let homestays = await Homestay.find(filter)
//       .select('-createdAt')
//       .populate({
//         path: 'category',
//         match: { isDisabled: false },
//       })
//       .populate('amenities')
//       .sort({ createdAt: -1 });

//     // Handle currency conversion if a different currency is specified
//     if (currency && currency.code !== 'INR') {
//       try {
//         const { data } = await axios.get(
//           `https://v6.exchangerate-api.com/v6/f33778d07ad0d3ffe8f9b95a/pair/INR/${currency.code}`
//         );

//         homestays = homestays.map(homestay => {
//           const convertedHomestay = homestay.toObject();
//           convertedHomestay.pricePerNight = (homestay.pricePerNight * data?.conversion_rate).toFixed(2);
//           return convertedHomestay;
//         });
//       } catch (conversionError) {
//         console.error('Currency conversion error:', conversionError);
//         // Optional: Return original prices if conversion fails
//       }
//     }

//     if (!homestays.length) {
//       return res.status(404).json({
//         success: false,
//         message: 'No homestays found',
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: homestays,
//     });
//   } catch (error) {
//     console.error('Error retrieving homestays:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'An error occurred while retrieving homestays',
//     });
//   }
// };


const getAllHomestays = async (req, res) => {
  try {
    const {
      category,
      price,
      numberOfGuest,
      numberOfRooms,
      numberOfBathrooms,
      city,
      currency,
      checkIn,
      checkOut,
    } = req.body;


    // Build the filter object dynamically
    const filter = {};

    // Category filter
    if (category && category.length > 0) {
      filter.category = { $in: category };
    }

    // Price range filter
    if (price && price.length === 2) {
      filter.pricePerNight = {
        $gte: price[0],
        $lte: price[1],
      };
    }

    // Number of guests filter
    if (numberOfGuest) {
      filter.maxGuests = { $gte: numberOfGuest };
    }

    // Number of rooms filter
    if (numberOfRooms) {
      filter.noOfRooms = { $gte: numberOfRooms };
    }

    // Number of bathrooms filter
    if (numberOfBathrooms) {
      filter.noOfBathRooms = { $gte: numberOfBathrooms };
    }

    // City filter
    if (city) {
      filter['address.city'] = { $in: city };
    }

    // Ensure non-disabled homestays
    filter.isDisabled = false;

    // Check for date range (checkIn & checkOut)
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);


      // Validate date range
      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date',
        });
      }

      // Find bookings with overlapping dates
      const bookings = await Booking.find({
        $or: [
          { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
        ],
      }).select('homestayId');

      // Extract unavailable homestay IDs
      const unavailableHomestayIds = bookings.map(booking => booking.homestayId.toString());

      // Add filter to exclude unavailable homestays
      if (unavailableHomestayIds.length > 0) {
        filter._id = { $nin: unavailableHomestayIds };
      }
    }

    let homestays = await Homestay.find(filter)
      .select('-createdAt')
      .populate({
        path: 'category',
        match: { isDisabled: false },
      })
      .populate('amenities')
      .sort({ createdAt: -1 });

    // Handle currency conversion if a different currency is specified

    if (currency && currency.code !== 'INR') {
      try {
        const { data } = await axios.get(`https://v6.exchangerate-api.com/v6/f33778d07ad0d3ffe8f9b95a/pair/INR/${currency.code}`);

        homestays = homestays.map(homestay => {
          const convertedHomestay = homestay.toObject();
          convertedHomestay.pricePerNight = (homestay.pricePerNight * data?.conversion_rate).toFixed(2);
          return convertedHomestay;
        });
      } catch (conversionError) {
        console.error('Currency conversion error:', conversionError);
      }
    }

    if (!homestays.length) {
      return res.status(404).json({
        success: false,
        message: 'No homestays found',
      });
    }

    return res.status(200).json({
      success: true,
      data: homestays,
    });
  } catch (error) {
    console.error('Error retrieving homestays:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving homestays',
    });
  }
};





//USER - GET ALL CATEGORIES
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDisabled: false }).sort({ createdAt: -1 });

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

const getHomestayById = async (req, res) => {
  const { error } = validateHomestayId.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { homestayId } = req.params;

  try {
    const homestay = await Homestay.findById(homestayId)
      .select("-createdAt") // Exclude 'createdAt'
      .populate("category")
      .populate("amenities");

    if (!homestay) {
      return res.status(404).json({
        success: false,
        message: "Homestay not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: homestay,
    });
  } catch (error) {
    console.error("Error retrieving homestay:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the homestay",
    })
  };
}

const getAvailableHomestayAddresses = async (req, res) => {
  try {
    // Fetch homestays that are not disabled and select only the address fields
    const homestays = await Homestay.find({ isDisabled: false }).select('address');

    if (!homestays.length) {
      return res.status(404).json({
        success: false,
        message: 'No available homestays found',
      });
    }

    // Map over the fetched homestays and extract the required address details
    const addresses = homestays.map(homestay => ({
      street: homestay.address.street,
      city: homestay.address.city,
      district: homestay.address.district,
      state: homestay.address.state,
    }));

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Error retrieving addresses of homestays:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving addresses of homestays',
    });
  }
};

const bookHomestay = async (req, res) => {
  try {
    const { homestayId, checkIn, checkOut } = req.body;

    // 1. Validate the input
    if (!req.userId || !homestayId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'All fields (userId, homestayId, checkIn, checkOut) are required.',
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after the check-in date.',
      });
    }

    // 2. Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      homestayId,
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
      ],
    });

    if (overlappingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'The selected room is not available for the specified dates.',
      });
    }

    // 3. Create the booking
    const newBooking = new Booking({
      userId: req.userId,
      homestayId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
    });

    await newBooking.save();

    // 4. Send the response
    return res.status(201).json({
      success: true,
      message: 'Room booked successfully.',
      data: newBooking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing the booking.',
    });
  }
};

//USER - GET PROFILE DATA
const getUserById = async (req, res) => {
  try {
    const userId = req.userId
    const user = await User.findOne({_id:userId});
    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({
      success: true,
      user
    })
  } catch (error) {
    console.error("Error retrieving user data:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the user data",
    })
  }
}


//USER - PROFILE UPDATION
const updateUserData = async (req, res) => {  
  try {
    const { error } = validateUserUpdate.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const userId = req.userId; 
    const { address, phone, gender } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (address) user.address = address;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;

    const updatedUser = await user.save();

    return res.status(200).json({
        success: true,
        message: "User updated successfully",
        // data: updatedUser,
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

//USER - PROFILE PICTURE UPDATE
const updateProPic = async (req, res) => {
  
  upload.single("profilePic")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(500).json({ message: "profilePic upload error" });
    }
    try {
      const userId = req.userId;

      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res
          .status(404)
          .json({ message: "User not found" });
      }

      let profilePicUrl = req.body.profilePic; 
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path);
          profilePicUrl = result.secure_url;
        } catch (cloudinaryError) {
          return res
            .status(500)
            .json({ message: "Error in uploading profile picture to Cloudinary" });
        }
      }
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: profilePicUrl },
        { new: true }
      );
      res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        profilePic: updatedUser.profilePic,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
}


//USER - GET ALL VALID COUPONS
const getValidCoupons = async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    const coupons = await Coupon.find({
      expiryDate: { $gte: today, $lte: nextMonth },
      isActive: true, // Ensure coupon is active
    });

    // Filter coupons based on usageLimit, usageCount, and userRestrictions
    const filteredCoupons = coupons.filter((coupon) => {
      // Check if the coupon has a usage limit and if the limit is reached
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        return false;
      }
      // Check user-specific usage restrictions
      const userUsage = coupon.userRestrictions?.get(userId) || 0;
      if (userUsage > 0) {
        return false;
      }
      return true; // Include the coupon if all conditions are satisfied
    });

    res.status(200).json({
      success: true,
      data: filteredCoupons,
    });
  } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch coupons",
    });
  }
}


//USER - APPLY COUPON
const applyCoupon = async (req, res) => {
  try {
    const { error } = validateApplyCoupon.validate(req.body);
    if (error) {
      return res.status(400).json({ success:false, message: error.details[0].message });
    }

    const userId = req.userId;
    const { couponCode, homestayId, numberOfDays } = req.body;

    const coupon = await Coupon.findOne({code : couponCode});
    if (!coupon) {
      return res.status(404).json({ success:false, message: 'Coupon not found.' });
    }

    // Check if the coupon is expired
    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ success:false, message: 'Coupon has expired' });
    }

    // Check if the coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({ success:false, message: 'Coupon is no longer active' });
    }

    // Check if the user has already redeemed the coupon
    const userUsageCount = coupon.userRestrictions.get(userId);
    if (userUsageCount) {
      return res.status(400).json({ success:false, message: 'You have already applied this coupon' });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success:false, message: 'Coupon usage limit exceeded.' });
    }

    const homestay = await Homestay.findById(homestayId);
    if (!homestay) {
      return res.status(404).json({ success:false, message: 'Homestay not found.' });
    }

    const totalPrice = homestay.pricePerNight * numberOfDays;
    let discountAmount = 0;

    if (coupon.discountType === 'percentage') {
      discountAmount = (totalPrice * coupon.discountValue) / 100;
      if (coupon.maxDiscount !== null) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }

    const newPrice = totalPrice - discountAmount;

    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully.',
      data :{
        originalPrice: totalPrice,
        discountAmount,
        newPrice,
        discountType: coupon?.discountType,
        code: coupon?.code,
        value: coupon?.discountValue,
      }
    });
  } catch (error) {
    console.error('Error applying coupon:', err);
    res.status(500).json({ message: 'Something went wrong'});
  }
}


module.exports = {
  userSignup,
  userOtpVerify,
  googleSignIn,
  userAccountCreation,
  useResendOtp,
  userLogout,
  getAllHomestays,
  getAllCategories,
  getHomestayById,
  getUserById,
  updateUserData,
  getAvailableHomestayAddresses,
  bookHomestay,
  updateProPic,
  getValidCoupons,
  applyCoupon,
}
