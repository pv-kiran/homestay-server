const { default: axios } = require("axios");
const User = require("../models/user");
const Homestay = require("../models/homestays");
const Category = require("../models/category");
const Coupon = require("../models/coupon");
const IdProofControl = require("../models/idProofControl");
const PDFDocument = require('pdfkit');
const { generateOtpEmailTemplate } = require("../templates/otpEmailTemplate");
const { generateContactUs } = require("../templates/contactUsTemplate");
const { transporter } = require("../utils/emailHelper");
const { getToken } = require("../utils/jwtHelper");
const { getOtpExpiry, generateOtp } = require("../utils/otpHelper");
const {
  validateUserSignup,
  validateOtp,
  userValidationSchema,
  // validateHomestayId,
  validateUserUpdate,
  validateApplyCoupon,
  validateSubmitReview,
} = require("../utils/validationHelper");

const Booking = require("../models/booking");
const Review = require("../models/review");

const { cloudinary } = require("../utils/cloudinaryHelper");
const { upload, idUpload } = require("../utils/multerHelper");
const { razorpay } = require("../utils/razorpay");

const { generateHeader } = require("../utils/receiptUtils/headerUtils");
const { generateBookingDetails } = require("../utils/receiptUtils/detailsUtils");
const { generateFooter } = require("../utils/receiptUtils/footerUtils");
const { default: mongoose } = require("mongoose");
const { convertPricesToINR } = require("../utils/conversion");
const { generateBookingSuccessTemplate } = require("../templates/bookingSuccessTemplate");
const { cancelationSuccessTemplate } = require("../templates/cancellationSuccessTemplate");




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
            isIdUploaded: user?.isIdUploaded,
            role: 'user'
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
        isIdUploaded: user?.isIdUploaded,
        role: 'user'
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
      message: "User Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred during logout",
    });
  }
};




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
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving categories",
    });
  }
};


const getHomestayById = async (req, res) => {

  const { homestayId, currency } = req.params;

  if (!mongoose.Types.ObjectId.isValid(homestayId)) {
    return res.status(400).json({ success: false, message: "Invalid Homestay ID" });
  }

  try {
    // Fetch homestay with all referenced data populated
    const homestay = await Homestay.findById(homestayId)
      .select("-createdAt")
      .populate("category")
      .populate("amenities")
      .populate("restaurants")
      .populate("homelyfoods")
      .populate("entertainments")
      .populate("rides")
      .populate("roomservice")
      .populate("otherservice");



    if (!homestay) {
      return res.status(404).json({ success: false, message: "Homestay not found" });
    }

    // If currency is not provided or is INR, return original data
    if (!currency || currency === "INR") {
      return res.status(200).json({ success: true, data: homestay });
    }


    // Fetch currency conversion rate
    let conversionRate = 1;
    try {
      // const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;
      const { data } = await axios.get(`https://v6.exchangerate-api.com/v6/f33778d07ad0d3ffe8f9b95a/pair/INR/${currency}`);
      conversionRate = data?.conversion_rate || 1;
    } catch (conversionError) {
      return res.status(502).json({ success: false, message: "Currency conversion service is unavailable." });
    }

    // Function to convert amount fields
    const convertAmount = (amount) => Number((amount * conversionRate).toFixed(2));


    const isUploaded = await IdProofControl.findOne();
    homestay.isIdProofMandatory = isUploaded?.isIdProofMandatory;

    // Convert pricePerNight
    homestay.pricePerNight = convertAmount(homestay.pricePerNight);
    // homestay.insuranceAmount = convertAmount(homestay.insuranceAmount);

    // Convert all menu items' prices in restaurants
    homestay.restaurants.forEach((restaurant) => {
      restaurant.menuItems.forEach((item) => {
        item.price = convertAmount(item.price);
      });
    });







    // Convert all menu items' prices in homelyfoods
    homestay.homelyfoods.forEach((homelyFood) => {
      homelyFood.menuItems.forEach((item) => {
        item.price = convertAmount(item.price);
      });
    });

    // Convert amounts in other referenced models
    homestay.entertainments.forEach((service) => {
      service.amount = convertAmount(service.amount);
    });

    homestay.rides.forEach((ride) => {
      ride.amount = convertAmount(ride.amount);
    });

    homestay.roomservice.forEach((service) => {
      service.amount = convertAmount(service.amount);
    });

    homestay.otherservice.forEach((service) => {
      service.amount = convertAmount(service.amount);
    });


    // Return updated homestay data with converted currency
    return res.status(200).json({ success: true, data: homestay });

  } catch (error) {
    return res.status(500).json({ success: false, message: "An error occurred while retrieving the homestay" });
  }
};

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
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving addresses of homestays',
    });
  }
};

const bookHomestay = async (req, res) => {
  try {
    const { homestayId, checkIn, checkOut, currency, couponCode, addOns } = req.body;

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

    const homestay = await Homestay.findById(homestayId);
    if (!homestay) {
      return res.status(404).json({
        success: false,
        message: "Homestay not found.",
      });
    }

    const getTotalAddonPrice = () => {
      const hasItems = Object.values(addOns).some(category => Object.keys(category).length > 0);

      if (!hasItems) {
        return 0;
      }

      const totalAmount = Object.values(addOns).reduce(
        (sum, category) =>
          sum + Object.values(category).reduce(
            (categorySum, item) => categorySum + item.price * item.quantity,
            0
          ),
        0
      );
      return totalAmount;
    }

    const dailyRate = homestay.pricePerNight;
    const numDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    let amount = dailyRate * numDays;

    const calculateInsurance = () => {
      return homestay?.insuranceAmount ? Math.ceil(((dailyRate * (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) * Math.ceil(homestay?.insuranceAmount)) / 100) : 0
    }

    const calculateGST = () => {
      return homestay?.gst ? Math.ceil(((dailyRate * (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) * Math.ceil(homestay?.gst)) / 100) : 0;
    }

    let conversionRate = 1;
    if (currency && currency.code !== 'INR') {
      try {
        const { data } = await axios.get(`https://v6.exchangerate-api.com/v6/f33778d07ad0d3ffe8f9b95a/pair/INR/${currency.code}`);
        conversionRate = data?.conversion_rate;
        amount = (amount * data?.conversion_rate).toFixed(2)
      } catch (conversionError) {
      }
    }






    const totalInsurance = calculateInsurance() * conversionRate
    const totalGst = calculateGST() * conversionRate

    const newPrice = Number(amount) + getTotalAddonPrice() + Math.ceil(totalInsurance) + Math.ceil(totalGst) + (homestay.pricePerNight * conversionRate)


    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found.' });
      }


      if (coupon.discountType === 'percentage') {
        discountAmount = (newPrice * coupon.discountValue) / 100;
        if (coupon.maxDiscount !== null) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount * conversionRate);
        }
      } else if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue * conversionRate;
      }
    }

    const homeStayPrice = newPrice - discountAmount






    const options = {
      amount: Math.ceil(homeStayPrice) * 100, // Amount in paise
      currency: currency.code,
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);
    if (!razorpayOrder) {
      return res.status(500).json({
        success: false,
        message: "Failed to create Razorpay order.",
      });
    }


    return res.status(201).json({
      success: true,
      message: 'Room booking initiated.',
      data: razorpayOrder
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing the booking.',
    });
  }
};

const bookHomestayComplete = async (req, res) => {
  try {
    const { homestayId,
      checkIn,
      checkOut,
      orderId,
      paymentId,
      addOns,
      currency,
      amount,
      guests
    } = req.body;


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

    const homestay = await Homestay.findById(homestayId);
    if (!homestay) {
      return res.status(404).json({
        success: false,
        message: "Homestay not found.",
      });
    }

    // const dailyRate = homestay.pricePerNight;
    // const numDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    // let amount = dailyRate * numDays;

    let price = 0
    let conversionRate = 1;
    if (currency && currency.code !== 'INR') {
      try {
        const { data } = await axios.get(`https://v6.exchangerate-api.com/v6/f33778d07ad0d3ffe8f9b95a/pair/${currency.code}/INR`);
        conversionRate = data?.conversion_rate;
        price = (amount * data?.conversion_rate).toFixed(2)
      } catch (conversionError) {
      }
    } else {
      price = amount;
    }

    let updatedSelectedItems = convertPricesToINR(addOns, conversionRate)

    const newBooking = new Booking({
      userId: req.userId,
      homestayId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      amount: price / 100,
      orderId,
      paymentId,
      selectedItems: updatedSelectedItems,
      guests,
      price: amount / 100
    });

    await newBooking.save();

    const populatedData = await Booking.findById(newBooking._id)
      .populate({
        path: 'homestayId',
        select: 'title address.street address.city address.district address.state address.coordinates',
      })
      .populate({
        path: 'userId',
        select: 'fullName email', // Select the 'fullName' field from User
      });


    const mailOptions = {
      from: "admin@gmail.com",
      to: `${populatedData?.userId?.email}`,
      subject: "Booking Confirmation",
      html: generateBookingSuccessTemplate(populatedData),
    };

    await transporter.sendMail(mailOptions);


    return res.status(201).json({
      success: true,
      message: 'Room booking completed.',
      data: {
        ...newBooking.toObject(),
        homestayName: populatedData?.homestayId?.title || null,
        userName: populatedData?.userId?.fullName || null,
        stayCity: populatedData?.homestayId?.address?.city || null,
        stayState: populatedData?.homestayId?.address?.state || null,
      }
    });

  } catch (error) {
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
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const bookingsCount = await Booking.countDocuments({ userId });

    res.status(200).json({
      success: true,
      user,
      bookingsCount
    })
  } catch (error) {
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

    const { currency } = req.query;

    // Filter coupons based on usageLimit, usageCount, and userRestrictions
    let filteredCoupons = coupons.filter((coupon) => {
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

    let conversionRate = 1;
    if (currency && currency !== 'INR') {
      try {
        const { data } = await axios.get(`https://v6.exchangerate-api.com/v6/f33778d07ad0d3ffe8f9b95a/pair/INR/${currency}`);
        conversionRate = data?.conversion_rate;
      } catch (conversionError) {
        console.error('Currency conversion error:', conversionError);
      }
    }


    filteredCoupons = filteredCoupons.map(coupon => ({
      ...coupon.toObject(),
      discountValue: coupon.discountType === 'fixed'
        ? Number((coupon.discountValue * conversionRate).toFixed(2))
        : coupon.discountValue,
      maxDiscount: coupon.maxDiscount
        ? Number((coupon.maxDiscount * conversionRate).toFixed(2))
        : null
    }));



    res.status(200).json({
      success: true,
      data: filteredCoupons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
    });
  }
}

const getUserBookings = async (req, res) => {
  const { currency } = req.query;
  try {
    // Fetch bookings for the given user and populate homestay details
    const bookings = await Booking.find({ userId: req.userId })
      .populate({
        path: 'homestayId', // Populate homestay details
        select: 'title images address cancellationPolicy', // Fetch specific fields
      })
      .sort({ checkIn: -1 }); // Optional: Sort by latest bookings

    if (!bookings.length) {
      return res.status(404).json({ message: 'No bookings found for this user' });
    }

    let conversionRate = 1;
    if (currency && currency !== 'INR') {
      try {
        const { data } = await axios.get(`https://v6.exchangerate-api.com/v6/f33778d07ad0d3ffe8f9b95a/pair/INR/${currency}`);
        conversionRate = data?.conversion_rate;
      } catch (conversionError) {
        console.error('Currency conversion error:', conversionError);
      }
    }


    // Transform bookings into desired format
    const bookingDetails = bookings.map(booking => ({
      _id: booking?._id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      paymentId: booking.paymentId,
      amount: Math.round(booking.amount * conversionRate),
      createdAt: booking.createdAt,
      homestayName: booking.homestayId?.title || 'Unknown Homestay',
      homestayImage: booking.homestayId?.images?.[0] || null,
      homestayAddress: booking.homestayId?.address || null,
      isCheckedIn: booking?.isCheckedIn,
      isCheckedOut: booking?.isCheckedOut,
      isCancelled: booking?.isCancelled,
      homestayId: booking?.homestayId._id,
      refundId: booking?.refundId,
      selectedItems: booking?.selectedItems,
      cancelationPolicy: booking?.homestayId?.cancellationPolicy,
    }));
    res.status(200).json(bookingDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markAsCheckedIn = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { isCheckedIn: true },
      { new: true } // Return the updated document
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Checked in successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const markAsCheckedOut = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { isCheckedOut: true },
      { new: true } // Return the updated document
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


const markAsCancelled = async (req, res) => {
  const { bookingId } = req.params;

  try {
    // First, find the booking without updating it
    const booking = await Booking.findById(bookingId)
      .populate('homestayId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is already cancelled
    if (booking.isCancelled) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    const diffInMs = booking?.checkIn - new Date();
    const diffInHours = diffInMs / (1000 * 60 * 60);



    let refundAmount = booking.amount;

    console.log(booking?.homestayId?.cancellationPolicy?.length)
    console.log(diffInHours)

    if (booking?.homestayId?.cancellationPolicy?.length > 0) {
      const canceledRule = booking?.homestayId?.cancellationPolicy?.filter((item) => item?.hoursBeforeCheckIn <= diffInHours)
      console.log(canceledRule.sort((a, b) => a - b));
      if (canceledRule?.length > 0) {
        refundAmount = (booking?.amount * canceledRule[0]?.refundPercentage) / 100
      } else {
        return res.status(400).json({
          success: false,
          message: 'Refund failed, no refund ID returned'
        });
      }
    }


    // Check if payment exists
    if (booking.paymentId && booking.orderId) {
      try {
        // Process refund through Razorpay
        const refund = await razorpay.payments.refund(booking.paymentId, {
          amount: refundAmount * 100, // Convert to paise
          notes: {
            bookingId: bookingId?._id,
            orderId: booking.orderId,
            homestayId: booking.homestayId?._id,
            reason: 'Booking cancellation'
          }
        });


        if (!refund || !refund.id) {
          return res.status(400).json({
            success: false,
            message: 'Refund failed, no refund ID returned'
          });
        }

        // Update booking with cancellation and refund details
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            isCancelled: true,
            cancelledAt: new Date(),
            isRefunded: true,
            refundId: refund.id,
            refundAmount: booking.amount,
            refundedAt: new Date()
          },
          { new: true }
        ).populate('userId')
          .populate('homestayId');


        const mailOptions = {
          from: "admin@gmail.com",
          to: `${updatedBooking?.userId?.email}`,
          subject: "Booking Confirmation",
          html: cancelationSuccessTemplate(updatedBooking),
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
          success: true,
          message: 'Booking cancelled and refund processed successfully',
          booking: updatedBooking,
          refund: {
            id: refund.id,
            amount: refund.amount / 100 // Convert back to rupees for display
          }
        });

      } catch (refundError) {
        console.log(refundError)
        return res.status(400).json({
          success: false,
          message: 'Failed to process refund',
          error: refundError.message
        });
      }
    }

    // If no payment ID exists or refund not needed, just cancel the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        isCancelled: true,
        cancelledAt: new Date()
      },
      { new: true }
    );





    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


const checkFutureBooking = async (req, res) => {
  const { homeStayId } = req.params
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  try {
    const booking = await Booking.findOne({
      userId: req.userId,
      homestayId: homeStayId,
      checkOut: { $gte: today },
    });


    if (booking) {
      return res.status(200).json({
        status: true,
        checkIn: booking.checkIn,
      });
    }
    res.status(200).json({
      status: false,
      checkIn: null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
}


const applyCoupon = async (req, res) => {
  try {
    const { error } = validateApplyCoupon.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const userId = req.userId;
    const { couponCode, homestayId, numberOfDays, currencyCode, insuranceAmount, addOnAmount, gst } = req.body;


    // Fetch coupon details
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    // Check coupon validity
    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired.' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: 'Coupon is no longer active.' });
    }

    // Check if the user has already used the coupon
    if (coupon.userRestrictions?.get(userId)) {
      return res.status(400).json({ success: false, message: 'You have already applied this coupon.' });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit exceeded.' });
    }

    // Fetch homestay details
    const homestay = await Homestay.findById(homestayId);
    if (!homestay) {
      return res.status(404).json({ success: false, message: 'Homestay not found.' });
    }

    const totalPrice = homestay.pricePerNight * numberOfDays;

    // Initialize conversion rate
    let conversionRate = 1;
    if (currencyCode && currencyCode !== 'INR') {
      try {
        const { data } = await axios.get(
          `https://v6.exchangerate-api.com/v6/f33778d07ad0d3ffe8f9b95a/pair/INR/${currencyCode}`
        );
        conversionRate = data?.conversion_rate || 1;
      } catch (error) {
        return res.status(500).json({ success: false, message: 'Currency conversion failed.' });
      }
    }

    const convertedTotalPrice = (totalPrice * conversionRate) + (insuranceAmount * numberOfDays) + addOnAmount + (homestay?.pricePerNight * conversionRate) + (gst * numberOfDays);


    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (convertedTotalPrice * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        console.log(discountAmount, coupon.maxDiscount);
        discountAmount = Math.min(discountAmount, coupon.maxDiscount * conversionRate);
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue * conversionRate;
    }


    const newPrice = convertedTotalPrice - discountAmount;

    // Validate the final calculated prices
    if (newPrice < 0) {
      return res.status(400).json({ success: false, message: 'Invalid discount calculation.' });
    }

    // Send response
    return res.status(200).json({
      success: true,
      message: 'Coupon applied successfully.',
      data: {
        originalPrice: convertedTotalPrice.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        newPrice: newPrice.toFixed(2),
        discountType: coupon.discountType,
        code: coupon.code,
        value: coupon.discountValue,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
};

//USER - GET  LATEST COUPON FOR LANDING PAGE AD
const getLatestValidCoupon = async (req, res) => {
  try {
    // Fetch the current date
    const currentDate = new Date();

    // Find the latest added coupon that satisfies all conditions
    const latestCoupon = await Coupon.findOne({
      isActive: true, // Coupon must be active
      expiryDate: { $gt: currentDate },
      discountType: 'percentage',
      $or: [
        { usageLimit: null }, // Unlimited usage
        { $expr: { $gt: ["$usageLimit", "$usageCount"] } }, // Usage limit not reached
      ],
    }).sort({ createdAt: -1 }); // Get the most recently created coupon

    // If no coupon found, return a message
    if (!latestCoupon) {
      return res.status(404).json({ message: 'No valid coupon found.' });
    }

    // Return the coupon details
    return res.status(200).json({
      success: true,
      coupon: latestCoupon,
    });
  } catch (error) {
    // Handle any potential errors
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the coupon.',
      error: error.message,
    });
  }
}

//USER - SUBMIT REVIEW
const submitReview = async (req, res) => {
  try {
    const { error } = validateSubmitReview.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const userId = req.userId;
    const { homestayId, rating, reviewText } = req.body;

    const booking = await Booking.findOne({
      userId,
      homestayId,
      isCheckedOut: true,
    });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: 'You can only review after checkout.'
      });
    }

    const existingReview = await Review.findOne({ userId, homestayId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this homestay.'
      });
    }

    const review = new Review({ userId, homestayId, rating, reviewText });
    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      // review 
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
}

//USER - GET REVIEWS BY HOMESTAY
const getReviewsByHomestay = async (req, res) => {
  const { homeStayId } = req.params;
  try {

    const reviews = await Review.find({ homestayId: homeStayId })
      .populate('userId', 'fullName email profilePic') // Populate name and email fields of the user
      .sort({ createdAt: -1 });

    if (reviews?.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No reviews found for this homestay',
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully',
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching reviews',
    });
  }
}

//USER - GENERATE RECIEPT AFTER BOOKING - IN SUCCESS PAGE OF UI
const generateReceipt = async (req, res) => {

  const { bookingId } = req.params;

  try {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=receipt.pdf');
    doc.pipe(res);

    const bookingDetails = await Booking.findById(bookingId)
      .populate({
        path: 'homestayId',
        select: 'title address.city address.state', // Select the 'name' field from Homestay
      })
      .populate({
        path: 'userId',
        select: 'fullName', // Select the 'fullName' field from User
      });

    const bookingData = [
      { label: 'Cust. Name', value: `${bookingDetails?.userId?.fullName}` },
      { label: 'Payment id', value: `${bookingDetails?.paymentId}` },
      {
        label: 'Booking Date', value: bookingDetails?.createdAt
          ? new Date(bookingDetails?.createdAt)?.toDateString()
          : 'N/A',
      },
      { label: 'Stay Details', value: `${bookingDetails?.homestayId?.title}, ${bookingDetails?.homestayId?.address?.city}, ${bookingDetails?.homestayId?.address?.state}` },
      {
        label: 'Check-in', value: bookingDetails?.checkIn
          ? new Date(bookingDetails?.checkIn)?.toDateString()
          : 'N/A',
      },
      {
        label: 'Check-out', value: bookingDetails?.checkOut
          ? new Date(bookingDetails?.checkOut)?.toDateString()
          : 'N/A',
      },
      { label: 'Amount Paid', value: `${bookingDetails?.amount}/-` }
    ];

    // Generate PDF sections
    let yPosition = generateHeader(doc, bookingDetails?.createdAt);
    yPosition = generateBookingDetails(doc, yPosition, bookingData);
    generateFooter(doc);

    doc.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

//USER - UPDATE ID PROOF
const updateIdProof = async (req, res) => {
  idUpload.single("idProof")(req, res, async (uploadError) => {
    if (uploadError) {

      return res.status(500).json({ message: "ID proof upload error" });
    }
    try {
      const userId = req.userId;

      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      let idProofUrl = req.body.idProof;
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path);
          idProofUrl = result.secure_url;
        } catch (cloudinaryError) {
          return res
            .status(500)
            .json({ message: "Error in uploading ID proof to Cloudinary" });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { idProof: idProofUrl, isIdUploaded: true },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "ID proof uploaded successfully",
        idProof: updatedUser.idProof,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
};

//USER - ID PROOF MANDATORY STATUS
const getIdProofStatus = async (req, res) => {
  try {
    const settings = await IdProofControl.findOne();
    return res.status(200).json({
      success: true,
      data: settings
        ? {
          disclaimerNote: settings.disclaimerNote,
          isIdProofMandatory: settings.isIdProofMandatory
        }
        : {},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching Id proof settings",
      error: error.message,
    });
  }
};

//USER - USER GET ALL CANCELLATION POLICY
const getCancellationPolicy = async (req, res) => {
  try {
    const { homestayId } = req.params;

    // Validate homestayId
    if (!homestayId) {
      return res.status(400).json({
        success: false,
        message: "Homestay ID is required.",
      });
    }

    // Fetch homestay and select only the cancellationPolicy field
    const homestay = await Homestay.findById(homestayId).select("cancellationPolicy");

    // If homestay does not exist or has no cancellation policy
    if (!homestay) {
      return res.status(404).json({
        success: false,
        message: "No homestay found with the given ID.",
      });
    }

    if (!homestay.cancellationPolicy || homestay.cancellationPolicy.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No cancellation policy found for this homestay.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cancellation policy retrieved successfully.",
      data: homestay.cancellationPolicy, // Returns only the cancellation policy
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching cancellation policy.",
      error: error.message,
    });
  }
};

//USER - CONTACT FORM
const contactUs = async (req, res) => {
  const { name, email, subject, message } = req.body;

  const mailOptions = {
    from: `${email}`,
    to: `silpasheelassk@gmail.com`,
    subject: "New Contact Form Submission",
    html: generateContactUs(name, email, subject, message),
  };
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message" });
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
  updateIdProof,
  getIdProofStatus,
  getCancellationPolicy,
  contactUs
}
