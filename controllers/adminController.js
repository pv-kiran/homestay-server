const Admin = require("../models/admin");
const Category = require("../models/category");
const Amenity = require("../models/amenity");
const Homestay = require("../models/homestays");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const Booking = require("../models/booking");
const RoomService = require("../models/roomService");
const Entertainment = require("../models/entertainment");
const OtherService = require("../models/otherService");
const IdProofControl = require("../models/idProofControl");
const { transporter } = require("../utils/emailHelper");
const { format } = require('date-fns');
const {
  validateAdminLogin,
  validateAdminSignup,
  validateOtp,
  validateCategory,
  validateHomestay,
  validateHomestayId,
  validateEmail,
  validateAmenity,
  validateUserId,
  validateUpdateCoupon,
  validateCreateCoupon,
  restaurantSchemaValidation,
  homelyFoodValidation,
  validateRoomService,
  validateIdProofControl,
  validateCancellationPolicy,
} = require("../utils/validationHelper");
const {
  getHashedPassword,
  verifyPassword,
} = require("../utils/passwordHelper");
const { generateOtp, getOtpExpiry } = require("../utils/otpHelper");
const { getToken } = require("../utils/jwtHelper");
const {
  generateAdminOtpEmailTemplate,
  generateAdminWelcomeEmailTemplate,
} = require("../templates/otpEmailTemplate");
const { cloudinary } = require("../utils/cloudinaryHelper");
const { upload } = require("../utils/multerHelper");
const Restaurant = require("../models/restaurent");
const HomelyFood = require("../models/homelyFood");
const Rides = require("../models/rides");
const { default: mongoose } = require("mongoose");
const { razorpay } = require("../utils/razorpay");

//ADMIN SIGNUP
const adminSignUp = async (req, res) => {
  const { error } = validateAdminSignup.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.details[0]?.message,
    });
  }
  const { name, email, password } = req.body;
  try {
    const adminExists = await Admin.findOne({ email: email });
    if (adminExists) {
      if (adminExists.isVerified) {
        const isCorrectPassword = await verifyPassword(
          password,
          adminExists.password
        );
        if (!isCorrectPassword) {
          return res.status(401).json({
            message: "Incorrect password. Please try again.",
            isVerified: adminExists.isVerified,
          });
        }
        return res.status(400).json({
          message: "Email ID already exists!",
          isVerified: adminExists.isVerified,
        });
      } else {
        const currentTime = Date.now();
        if (adminExists.otpExpiry > currentTime) {
          return res.status(200).json({
            message: "Enter OTP to finish signup.",
            admin: {
              _id: adminExists._id,
              email: adminExists.email,
            },
            otpExpiry: adminExists.otpExpiry,
            isVerified: adminExists.isVerified,
          });
        } else {
          const otp = generateOtp();
          const otpExpiry = getOtpExpiry();

          adminExists.otp = otp;
          adminExists.otpExpiry = otpExpiry;
          await adminExists.save();

          // Resend OTP
          const mailOptions = {
            from: "admin@gmail.com",
            to: `${email}`,
            subject: "ADMIN SIGNUP - OTP VERIFICATION",
            html: generateAdminOtpEmailTemplate(email, otp),
          };

          await transporter.sendMail(mailOptions);

          return res.status(201).json({
            success: true,
            message: "OTP has expired. A new OTP has been sent to your email.",
            admin: {
              _id: adminExists._id,
              email: adminExists.email,
            },
            otpExpiry: adminExists.otpExpiry,
            isVerified: adminExists.isVerified,
          });
        }
      }
    } else {
      const encPassword = await getHashedPassword(password);
      const otp = generateOtp();
      const otpExpiry = getOtpExpiry();

      const newAdmin = await Admin.create({
        name: name,
        email: email,
        password: encPassword,
        otp: otp,
        otpExpiry: otpExpiry,
      });

      // OTP Send
      const mailOptions = {
        from: "admin@gmail.com",
        to: `${email}`,
        subject: "ADMIN SIGNUP - OTP VERIFICATION",
        html: generateAdminOtpEmailTemplate(email, otp),
      };

      await transporter.sendMail(mailOptions);

      return res.status(201).json({
        success: true,
        admin: {
          _id: newAdmin._id,
          email: newAdmin.email,
        },
        otpExpiry: adminExists.otpExpiry,
        message:
          "Signup successful! Please check your email for OTP verification.",
      });
    }
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

//ADMIN OTP VERIFICATION
const adminOtpVerify = async (req, res) => {
  const { error } = validateOtp.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { email, otp } = req.body;
  try {
    const admin = await Admin.find({ email: email });

    if (parseInt(otp) === admin[0].otp) {
      if (Date.now() < admin[0].otpExpiry) {
        await Admin.findOneAndUpdate(
          { email: email },
          { $set: { isVerified: true } }
        );
        admin[0].otp = undefined;
        admin[0].otpExpiry = undefined;
        await admin[0].save();

        const mailOptions = {
          from: "admin@gmail.com",
          to: `${email}`,
          subject: "OTP VERIFICATION SUCCESSFUL",
          html: generateAdminWelcomeEmailTemplate(admin[0].name),
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
          success: true,
          message: "OTP verification successful",
        });
      } else {
        return res.status(400).json({
          success: true,
          message: "OTP already expired !",
        });
      }
    } else {
      return res.status(400).json({
        success: true,
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

//ADMIN LOGIN
const adminLogin = async (req, res) => {
  const { error } = validateAdminLogin.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.details[0]?.message,
    });
  }

  const { email, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ email: email });

    if (adminExists) {
      if (!adminExists.isVerified) {
        return res.status(400).json({
          message: "Please complete OTP verification to login.",
          isVerified: adminExists.isVerified,
        });
      }
      const isCorrectPassword = await verifyPassword(
        password,
        adminExists.password
      );
      if (isCorrectPassword) {
        const token = await getToken(adminExists._id, email);

        adminExists.password = undefined;
        adminExists.token = token;

        const options = {
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          httpOnly: true,
        };

        return res
          .status(200)
          .cookie("token", token, options)
          .json({
            success: true,
            admin: {
              _id: adminExists._id,
              email: adminExists.email,
              token: token,
              isVerified: adminExists.isVerified,
              role: adminExists.role,
            },
            message: "Admin Login Successful",
          });
      } else {
        return res.status(400).json({
          errorInfo: "Incorrect password",
        });
      }
    } else {
      return res.status(404).json({
        errorInfo: `We didn't recognize this email`,
      });
    }
  } catch (err) {
    res.status(500).json({
      errorInfo: "Internal server error",
    });
  }
};

//ADMIN LOGOUT
const adminLogout = async (req, res) => {
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

// Admin Resend OTP
const adminResendOtp = async (req, res) => {
  const { error } = validateEmail.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.details[0]?.message,
    });
  }

  try {
    const adminExists = await Admin.findOne({ email: req.body?.email });
    if (!adminExists) {
      return res.status(400).json({
        message: "Email ID doesn't exists!",
        isVerified: adminExists.isVerified,
      });
    }
    const otp = generateOtp();
    const otpExpiry = getOtpExpiry();
    adminExists.otp = otp;
    adminExists.otpExpiry = otpExpiry;
    await adminExists.save();
    const mailOptions = {
      from: "admin@gmail.com",
      to: `${req.body?.email}`,
      subject: "ADMIN SIGNUP - OTP VERIFICATION",
      html: generateAdminOtpEmailTemplate(req.body?.email, otp),
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: "A new OTP has been sent to your email.",
      admin: {
        _id: adminExists._id,
        email: adminExists.email,
      },
      otpExpiry: adminExists.otpExpiry,
      isVerified: adminExists.isVerified,
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

//ADMIN CATEGORY MANAGEMENT - ADD
const addCategory = async (req, res) => {
  upload.single("iconUrl")(req, res, async (error) => {
    if (error) {
      return res.status(500).json({
        message: "Icon upload error",
      });
    }
    try {
      const { error } = validateCategory.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const existingCategory = await Category.findOne({
        categoryName: req.body.categoryName,
        isDisabled: false,
      });
      if (existingCategory) {
        return res
          .status(400)
          .json({ message: "Category with this name already exists" });
      }

      let iconUrl = "";
      if (req.file) {
        const icon = await cloudinary.uploader.upload(req.file.path);
        iconUrl = icon.secure_url;
      }

      const newCategory = new Category({
        categoryName: req.body.categoryName,
        iconUrl: iconUrl,
      });

      await newCategory.save();
      res.status(201).json({
        success: true,
        message: "Category created successfully",
        category: newCategory,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  });
};

//ADMIN CATEGORY MANAGEMENT - UPDATE
const updateCategory = async (req, res) => {
  upload.single("iconUrl")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(500).json({ message: "Icon upload error" });
    }

    try {
      const { error } = validateCategory.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { categoryId } = req.params;

      // Check if a category with the same name exists (excluding the current category)
      const existingCategory = await Category.findOne({
        categoryName: req.body.categoryName,
        _id: { $ne: categoryId },
        isDisabled: false,
      });
      if (existingCategory) {
        return res
          .status(400)
          .json({ message: "Category with this name already exists" });
      }

      // Handle icon upload if a new file is provided
      let iconUrl = req.body.iconUrl; // default to existing iconUrl
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path);
          iconUrl = result.secure_url;
        } catch (cloudinaryError) {
          return res
            .status(500)
            .json({ message: "Error in uploading icon to Cloudinary" });
        }
      }
      // Update the category
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { categoryName: req.body.categoryName, iconUrl: iconUrl },
        { new: true }
      );

      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category: updatedCategory,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
};

//ADMIN CATEGORY MANAGEMENT - DISABLE & ENABLE
const toggleCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Toggle the isDisabled state
    category.isDisabled = !category.isDisabled;

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: updatedCategory.isDisabled
        ? "Category disabled successfully"
        : "Category enabled successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//ADMIN CATEGORY MANAGEMENT - GET ALL CATEGORIES
const getAllCategories = async (req, res) => {
  try {

    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;
    const searchQuery = searchParams
      ? { categoryName: { $regex: searchParams, $options: "i" } }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    const totalCategories = await Category.countDocuments(searchQuery);

    const categories = await Category.find(searchQuery)
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1 });

    if (!categories.length) {
      return res.status(404).json({
        success: false,
        message: "No categories found",
      });
    }

    return res.status(200).json({
      success: true,
      data: categories,
      totalCategories,
      totalPages: Math.ceil(totalCategories / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving categories",
    });
  }
};

//ADMIN - ADD HOMESTAY
const addHomestay = async (req, res) => {
  try {
    const { error } = validateHomestay.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const homestayData = req.body;

    const category = await Category.findOne({ _id: homestayData.categoryId });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    else {
      homestayData.category = category._id;
    }
    // Validate and assign amenities
    const amenityIds = homestayData.amenityIds || [];
    const amenities = await Amenity.find({ _id: { $in: amenityIds } });

    if (amenities.length !== amenityIds.length) {
      return res.status(404).json({ message: "One or more amenities not found" });
    }
    homestayData.amenities = amenities.map(amenity => amenity._id);

    const existingHomestay = await Homestay.findOne({
      title: homestayData.title,
      "address.street": homestayData.address.street,
      "address.city": homestayData.address.city,
      "address.zip": homestayData.address.zip,
    });
    if (existingHomestay) {
      return res.status(409).json({
        message: "A homestay with the same title and address already exists.",
      });
    }

    let uploadedImages = [];
    if (req.files && req.files.images) {
      const imageUploadPromises = req.files.images.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "homestays" })
      );

      const imageUploadResults = await Promise.all(imageUploadPromises);
      uploadedImages = imageUploadResults.map((result) => result.secure_url);
    }
    homestayData.images = uploadedImages;

    const newHomestay = new Homestay(homestayData);
    await newHomestay.save();
    return res.status(201).json({
      success: true,
      message: "Homestay added successfully",
      homestay: newHomestay,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error adding homestay" });
  }
};

//ADMIN - UPDATE HOMESTAY
const updateHomestay = async (req, res) => {
  try {
    const { error } = validateHomestay.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const homestayData = req.body;
    const { homestayId } = req.params;

    // Find the existing homestay
    const existingHomestay = await Homestay.findById(homestayId);
    if (!existingHomestay) {
      return res.status(404).json({ message: "Homestay not found" });
    }

    // Check if category exists
    const category = await Category.findOne({ _id: homestayData.categoryId });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    homestayData.category = category._id;

    // Validate and assign amenities
    const amenityIds = homestayData.amenityIds || [];
    const amenities = await Amenity.find({ _id: { $in: amenityIds } });
    if (amenities.length !== amenityIds.length) {
      return res.status(404).json({ message: "One or more amenities not found" });
    }
    homestayData.amenities = amenities.map(amenity => amenity._id);

    // Check for duplicate homestay with the same title and address
    const duplicateHomestay = await Homestay.findOne({
      _id: { $ne: homestayId },
      title: homestayData.title,
      "address.street": homestayData.address.street,
      "address.city": homestayData.address.city,
      "address.zip": homestayData.address.zip,
    });
    if (duplicateHomestay) {
      return res.status(409).json({
        message: "A homestay with the same title and address already exists.",
      });
    }

    // Handle image uploads
    let uploadedImages = req.body.homestayImages ? req.body.homestayImages : [];

    // Upload new images if present
    if (req.files && req.files.images) {
      const imageUploadPromises = req.files.images.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "homestays" })
      );
      const imageUploadResults = await Promise.all(imageUploadPromises);
      uploadedImages = uploadedImages.concat(
        imageUploadResults.map((result) => result.secure_url)
      );
    }

    // Update the homestay with new data
    Object.assign(existingHomestay, { ...homestayData, images: uploadedImages });
    await existingHomestay.save();

    return res.status(200).json({
      success: true,
      message: "Homestay updated successfully",
      homestay: existingHomestay,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating homestay" });
  }
};

//ADMIN - TOGGLE HOMESTAY - DISABLING & ENABLING
const toggleHomestayStatus = async (req, res) => {
  try {
    const { homestayId } = req.params;

    const existingHomestay = await Homestay.findById(homestayId);
    if (!existingHomestay) {
      return res.status(404).json({ message: "Homestay not found" });
    }
    // Toggle the isDisabled status
    existingHomestay.isDisabled = !existingHomestay.isDisabled;

    // Save the updated homestay
    await existingHomestay.save();

    return res.status(200).json({
      success: true,
      message: `Homestay has been ${existingHomestay.isDisabled ? "disabled" : "enabled"
        } successfully`,
      homestay: existingHomestay,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error toggling homestay status" });
  }
};

//ADMIN - FETCH HOMESTAY BY ID
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
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the homestay",
    });
  }
};

//ADMIN - FETCH ALL HOMESTAYS
const getAllHomestays = async (req, res) => {
  try {
    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;

    const searchQuery = searchParams
      ? { title: { $regex: searchParams, $options: "i" } }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    const totalHomestays = await Homestay.countDocuments(searchQuery);

    const homestays = await Homestay.find(searchQuery)
      .select("-createdAt")
      .populate("category")
      .populate("amenities")
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1 });

    if (!homestays.length) {
      return res.status(404).json({
        success: false,
        message: "No homestays found",
      });
    }

    return res.status(200).json({
      success: true,
      data: homestays,
      totalHomestays,
      totalPages: Math.ceil(totalHomestays / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving homestays",
    });
  }
};


//ADMIN - ADD AMENITIES
const addAmenities = async (req, res) => {
  upload.single("iconUrl")(req, res, async (error) => {
    if (error) {
      return res.status(500).json({
        message: "Icon upload error",
      });
    }
    try {
      const { error } = validateAmenity.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const existingAmenity = await Amenity.findOne({
        amenityName: req.body.amenityName,
        isDisabled: false,
      });
      if (existingAmenity) {
        return res
          .status(400)
          .json({ message: "Amenity with this name already exists" });
      }

      let iconUrl = "";
      if (req.file) {
        const icon = await cloudinary.uploader.upload(req.file.path);
        iconUrl = icon.secure_url;
      }

      const newAmenity = new Amenity({
        amenityName: req.body.amenityName,
        description: req.body.description,
        iconUrl: iconUrl,
      });

      await newAmenity.save();
      res.status(201).json({
        success: true,
        message: "Amenity created successfully",
        amenity: newAmenity,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  });
};


//ADMIN - UPDATE AMENITY
const updateAmenity = async (req, res) => {
  upload.single("iconUrl")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(500).json({ message: "Icon upload error" });
    }

    try {
      const { error } = validateAmenity.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { amenityId } = req.params;

      // Check if a amenity with the same name exists (excluding the current amenity)
      const existingAmenity = await Amenity.findOne({
        amenityName: req.body.amenityName,
        _id: { $ne: amenityId },
        isDisabled: false,
      });
      if (existingAmenity) {
        return res
          .status(400)
          .json({ message: "Amenity with this name already exists" });
      }

      // Handle icon upload if a new file is provided
      let iconUrl = req.body.iconUrl; // default to existing iconUrl
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path);
          iconUrl = result.secure_url;
        } catch (cloudinaryError) {
          return res
            .status(500)
            .json({ message: "Error in uploading icon to Cloudinary" });
        }
      }
      // Update the amenity
      const updatedAmenity = await Amenity.findByIdAndUpdate(
        amenityId,
        {
          amenityName: req.body.amenityName,
          description: req.body.description,
          iconUrl: iconUrl
        },
        { new: true }
      );

      if (!updatedAmenity) {
        return res.status(404).json({ message: "Amenity not found" });
      }

      res.status(200).json({
        success: true,
        message: "Amenity updated successfully",
        amenity: updatedAmenity,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
};

//ADMIN AMENITY MANAGEMENT - DISABLE & ENABLE
const toggleAmenityStatus = async (req, res) => {
  try {
    const { amenityId } = req.params;
    const amenity = await Amenity.findById(amenityId);

    if (!amenity) {
      return res.status(404).json({ message: "Amenity not found" });
    }

    // Toggle the isDisabled state
    amenity.isDisabled = !amenity.isDisabled;

    const updatedAmenity = await amenity.save();

    res.status(200).json({
      success: true,
      message: updatedAmenity.isDisabled
        ? "Amenity disabled successfully"
        : "Amenity enabled successfully",
      amenity: updatedAmenity,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//ADMIN AMENITY MANAGEMENT - GET ALL AMENITIES

const getAllAmenities = async (req, res) => {
  try {
    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;

    const searchQuery = searchParams
      ? { amenityName: { $regex: searchParams, $options: "i" } }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    const totalAmenities = await Amenity.countDocuments(searchQuery);

    const amenities = await Amenity.find(searchQuery)
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1, _id: 1 });

    if (!amenities.length) {
      return res.status(404).json({
        success: false,
        message: "No amenities found",
      });
    }

    return res.status(200).json({
      success: true,
      data: amenities,
      totalAmenities,
      totalPages: Math.ceil(totalAmenities / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving amenities"
    });
  }
};


//ADMIN - GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    // Destructure pagination and search parameters from request body
    const { pagePerData = 10, pageNumber = 1, searchParams = "" } = req.body;
    // Build the search query for filtering users based on searchParams
    const searchQuery = searchParams
      ? { fullName: { $regex: searchParams, $options: "i" } } // Assuming 'name' is a field in your User schema
      : {};

    // Calculate the number of documents to skip based on the page number
    const skip = (pageNumber - 1) * pagePerData;

    // Retrieve the total count of documents matching the search query
    const totalUsers = await User.countDocuments(searchQuery);

    // Retrieve users with pagination and search, excluding sensitive fields
    const users = await User.find(searchQuery)
      .select("-otp -otpExpiry") // Exclude sensitive fields
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1 });

    // Check if any users were found
    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    // Return paginated and filtered users with total count
    return res.status(200).json({
      success: true,
      data: users,
      totalUsers, // Total count of matched users for pagination
      totalPages: Math.ceil(totalUsers / pagePerData), // Total number of pages
      currentPage: pageNumber,
      pageSize: pagePerData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving users",
    });
  }
};


//ADMIN - GET USER BY ID
const getUserById = async (req, res) => {
  const { error } = validateUserId.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-otp -otpExpiry');

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "User data retrieved successfully.",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while retrieving user data.",
      error: error.message,
    });
  }
}


//ADMIN - TOGGLE USER STATUS - DISABLE & REACTIVATION
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Toggle the isDisabled state
    user.isDisabled = !user.isDisabled;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: updatedUser.isDisabled
        ? "User disabled successfully"
        : "User reactivated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


//ADMIN - ADD COUPON
const createCoupon = async (req, res) => {
  try {
    const { error } = validateCreateCoupon.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { code, discountType, discountValue, maxDiscount, expiryDate, usageLimit, description } = req.body;

    // Check for duplicate coupon code
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon with this code already exists' });
    }

    const coupon = new Coupon({
      code,
      discountType,
      discountValue,
      maxDiscount,
      expiryDate,
      usageLimit,
      description,
      // createdBy: 'admin',
    });

    await coupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon', error });
  }
}

//ADMIN - UPDATE COUPON
const updateCoupon = async (req, res) => {
  try {
    const { error } = validateUpdateCoupon.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params; // Get coupon ID from request params
    // Ensure the coupon to update exists
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    // Check for duplicate coupon code (excluding the current coupon being updated)
    if (req.body.code) {
      const duplicateCoupon = await Coupon.findOne({ code: req.body.code, _id: { $ne: id } });
      if (duplicateCoupon) {
        return res.status(400).json({ message: 'A coupon with this code already exists' });
      }
    }
    // Update the coupon details with the fields from the request body
    const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });

    res.status(200).json({ message: 'Coupon updated successfully', updatedCoupon });
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon', error });
  }
}


//ADMIN - TOGGLE COUPON STATUS
const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    // Toggle the isDisabled status
    existingCoupon.isActive = !existingCoupon.isActive;

    // Save the updated coupon
    await existingCoupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon has been ${existingCoupon.isActive ? "activated" : "disabled"
        } successfully`,
      coupon: existingCoupon,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error toggling coupon status" });
  }
}


//ADMIN - GET ALL COUPONS
const getAllCoupons = async (req, res) => {
  try {

    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;
    const searchQuery = searchParams
      ? { code: { $regex: searchParams, $options: "i" } }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    const totalCoupons = await Coupon.countDocuments(searchQuery);

    const coupons = await Coupon.find(searchQuery)
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1 });

    if (!coupons.length) {
      return res.status(404).json({
        success: false,
        message: "No coupons found",
      });
    }

    const formattedCoupons = coupons?.map(coupon => ({
      ...coupon?._doc,
      expiryDate: format(new Date(coupon?.expiryDate), 'dd-MM-yyyy'),
      discountValue: coupon.discountType === 'percentage'
        ? `${coupon.discountValue}%`
        : `${coupon.discountValue}/-`,
    }));

    return res.status(200).json({
      success: true,
      data: formattedCoupons,
      totalCoupons,
      totalPages: Math.ceil(totalCoupons / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving coupons"
    })
  }
}


const getAllBookings = async (req, res) => {
  try {
    const { pagePerData = 10, pageNumber = 1, searchParams = "" } = req.body;

    // Build the search query
    const searchQuery = searchParams
      ? {
        $or: [
          { paymentId: { $regex: searchParams, $options: "i" } },
          { orderId: { $regex: searchParams, $options: "i" } },
        ],
      }
      : {};

    // Calculate skip and limit for pagination
    const skip = (pageNumber - 1) * pagePerData;

    // Total number of bookings matching the search
    const totalBookings = await Booking.countDocuments(searchQuery);

    // Fetch paginated bookings with populated homestay details
    const bookings = await Booking.find(searchQuery)
      .populate({
        path: "userId",
        select: "fullName email",
      })
      .populate({
        path: "homestayId",
        select: "title images address",
      })
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1 }); // Sort by creation date, latest first

    // Check if no bookings were found
    if (!bookings.length) {
      return res.status(404).json({
        success: false,
        message: "No bookings found",
      });
    }

    // Transform bookings into desired format
    const bookingDetails = bookings.map((booking) => ({
      _id: booking._id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      paymentId: booking.paymentId,
      orderId: booking?.orderId,
      amount: booking.amount,
      createdAt: booking.createdAt,
      homestayName: booking.homestayId?.title || "Unknown Homestay",
      homestayImage: booking.homestayId?.images?.[0] || null,
      homestayAddress: booking.homestayId?.address || null,
      isCheckedIn: booking.isCheckedIn,
      isCheckedOut: booking.isCheckedOut,
      isCancelled: booking.isCancelled,
      userName: booking?.userId?.fullName,
      addOns: booking?.selectedItems,
      refundId: booking?.refundId,
      isRefunded: booking?.isRefunded,
      refundedAt: booking?.refundedAt
    }));

    // Respond with transformed bookings and pagination details
    return res.status(200).json({
      success: true,
      data: bookingDetails,
      totalBookings,
      totalPages: Math.ceil(totalBookings / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving coupons"
    })
  }
};


const reorderImages = async (req, res) => {
  const { id } = req.params; // Homestay ID from the URL
  // Validate request body
  if (!Array.isArray(req.body) || !req.body.every((img) => typeof img === 'string')) {
    return res.status(400).json({ error: 'Images must be an array of strings.' });
  }

  try {
    // Find and update the Homestay
    const updatedHomestay = await Homestay.findByIdAndUpdate(
      id,
      { $set: { images: req.body } },
      { new: true, runValidators: true } // Returns the updated document and validates the data
    );

    // If no Homestay is found
    if (!updatedHomestay) {
      return res.status(404).json({ error: 'Homestay not found.' });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: 'Images updated successfully.',
      homestay: updatedHomestay,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: 'An error occurred while updating images.' });
  }
};

const getYearlyReport = async (req, res) => {
  try {
    const yearlyData = await Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$createdAt" } },
          totalRevenue: { $sum: "$amount" },
          totalBookings: { $sum: 1 },
          cancelledBookings: { $sum: { $cond: [{ $eq: ["$isCancelled", true] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id",
          totalRevenue: 1,
          totalBookings: 1,
          cancelledBookings: 1,
          successRate: {
            $multiply: [
              {
                $divide: [
                  { $subtract: ["$totalBookings", "$cancelledBookings"] },
                  "$totalBookings"
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { year: 1 } }
    ]);

    res.json(yearlyData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const getMonthlyReport = async (req, res) => {
  try {
    // Aggregate bookings by month
    const monthlyData = await Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%b", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          bookings: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          revenue: 1,
          bookings: 1,
          occupancyRate: { $multiply: [{ $divide: ["$bookings", 40] }, 100] } // Assuming max 40 bookings per month
        }
      },
      { $sort: { month: 1 } }
    ]);



    res.json(monthlyData);
  } catch (error) {

    res.status(500).json({ message: error.message });
  }
}

const getHomeStaywiseReport = async (req, res) => {
  try {
    // Aggregate bookings grouped by homestay
    const homestayPerformance = await Booking.aggregate([
      {
        $group: {
          _id: "$homestayId",
          revenue: { $sum: "$amount" },
          bookings: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'homestays', // Ensure this matches your collection name
          localField: '_id',
          foreignField: '_id',
          as: 'homestayDetails'
        }
      },
      {
        $unwind: "$homestayDetails"
      },
      {
        $project: {
          id: { $toString: "$_id" },
          name: "$homestayDetails.title",
          revenue: 1,
          bookings: 1
        }
      }
    ]);

    res.json(homestayPerformance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const getCategoryWiseReport = async (req, res) => {
  try {
    // Aggregate bookings grouped by category
    const categoryPerformance = await Homestay.aggregate([
      {
        $lookup: {
          from: 'bookings', // Ensure this matches your collection name
          localField: '_id',
          foreignField: 'homestayId',
          as: 'bookings'
        }
      },
      {
        $lookup: {
          from: 'categories', // Ensure this matches your collection name
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: "$categoryDetails"
      },
      {
        $unwind: "$bookings"
      },
      {
        $group: {
          _id: "$categoryDetails.categoryName",
          revenue: { $sum: "$bookings.amount" },
          bookings: { $sum: 1 }
        }
      },
      {
        $project: {
          category: "$_id",
          revenue: 1,
          bookings: 1,
          _id: 0
        }
      }
    ]);

    res.json(categoryPerformance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const getOverallReport = async (req, res) => {
  try {
    const [totalHomestays, bookingStats] = await Promise.all([
      Homestay.countDocuments({ isDisabled: false }),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: "$amount" }
          }
        }
      ])
    ]);

    const totalBookings = bookingStats[0]?.totalBookings || 0;
    const totalRevenue = bookingStats[0]?.totalRevenue || 0;

    // Assuming max capacity is 40 bookings per homestay per month
    const maxPossibleBookings = totalHomestays * 40 * 12;
    const occupancyRate = maxPossibleBookings > 0
      ? ((totalBookings / maxPossibleBookings) * 100).toFixed(2)
      : 0;

    res.json({
      totalHomestays,
      totalBookings,
      totalRevenue,
      occupancyRate: parseFloat(occupancyRate)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const addRestaurent = async (req, res) => {
  const { error } = restaurantSchemaValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details.map(detail => detail.message) });
  }

  try {
    // Check if the restaurant name already exists
    const existingRestaurant = await Restaurant.findOne({ restaurantName: req?.body?.restaurantName });
    if (existingRestaurant) {
      return res.status(400).json({ error: 'Restaurant with this name already exists' });
    }

    // Create new restaurant instance and save
    const newRestaurant = new Restaurant(req.body);
    await newRestaurant.save();
    res.status(201).json({ message: 'Restaurant added successfully', restaurant: newRestaurant });

  } catch (err) {
    // Handling duplicate key error from MongoDB unique index
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Restaurant with this name already exists' });
    }
    res.status(500).json({ error: 'Error adding restaurant', details: err.message });
  }
}

const getAllRestaurants = async (req, res) => {
  try {
    // Destructure request body with default values
    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;

    // Search query for restaurant name or city
    const searchQuery = searchParams
      ? {
        $or: [
          { restaurantName: { $regex: searchParams, $options: "i" } },
          { city: { $regex: searchParams, $options: "i" } }
        ]
      }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    // Count total restaurants matching search criteria
    const totalRestaurants = await Restaurant.countDocuments(searchQuery);

    // Retrieve paginated list of restaurants
    const restaurants = await Restaurant.find(searchQuery)
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1 });

    // Handle no data found scenario
    if (!restaurants.length) {
      return res.status(404).json({
        success: false,
        message: "No restaurants found",
      });
    }

    // Respond with paginated restaurant data
    return res.status(200).json({
      success: true,
      data: restaurants,
      totalRestaurants,
      totalPages: Math.ceil(totalRestaurants / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving restaurants",
    });
  }
};

const updateRestaurant = async (req, res) => {
  const { id } = req.params; // Assuming you're passing the restaurant ID in the URL
  const { error } = restaurantSchemaValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details.map(detail => detail.message) });
  }

  try {
    // Check if the restaurant exists
    const existingRestaurant = await Restaurant.findById(id);
    if (!existingRestaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check if the updated name already exists for another restaurant
    if (req.body.restaurantName) {
      const duplicateRestaurant = await Restaurant.findOne({
        restaurantName: req.body.restaurantName,
        _id: { $ne: id }, // Exclude the current restaurant from the search
      });
      if (duplicateRestaurant) {
        return res.status(400).json({ error: 'Restaurant with this name already exists' });
      }
    }

    // Update restaurant details
    Object.assign(existingRestaurant, req.body); // Merge updates into the existing restaurant
    await existingRestaurant.save();

    res.status(200).json({ message: 'Restaurant updated successfully', restaurant: existingRestaurant });

  } catch (err) {
    // Handling duplicate key error from MongoDB unique index
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Restaurant with this name already exists' });
    }
    res.status(500).json({ error: 'Error updating restaurant', details: err.message });
  }
};


const addHomelyFood = async (req, res) => {
  const { error } = homelyFoodValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details.map(detail => detail.message) });
  }

  try {
    // Check if the restaurant name already exists
    const existingHomelyFood = await HomelyFood.findOne({ homelyFoodCenterName: req?.body?.homelyFoodCenterName });
    if (existingHomelyFood) {
      return res.status(400).json({ error: 'Restaurant with this name already exists' });
    }

    // Create new restaurant instance and save
    const newHomelyFood = new HomelyFood(req.body);
    await newHomelyFood.save();
    res.status(201).json({ message: 'Restaurant added successfully', homelyFoodCenter: newHomelyFood });

  } catch (err) {
    // Handling duplicate key error from MongoDB unique index
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Restaurant with this name already exists' });
    }
    res.status(500).json({ error: 'Error adding restaurant', details: err.message });
  }
}

const getAllHomelyFood = async (req, res) => {
  try {
    // Destructure request body with default values
    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;

    // Search query for restaurant name or city
    const searchQuery = searchParams
      ? {
        $or: [
          { homelyFoodCenterName: { $regex: searchParams, $options: "i" } },
          { city: { $regex: searchParams, $options: "i" } }
        ]
      }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    // Count total restaurants matching search criteria
    const totalHomelyFoodCenter = await HomelyFood.countDocuments(searchQuery);

    // Retrieve paginated list of restaurants
    const homelyFood = await HomelyFood.find(searchQuery)
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1 });

    // Handle no data found scenario
    if (!homelyFood.length) {
      return res.status(404).json({
        success: false,
        message: "No homelyFood found",
      });
    }

    // Respond with paginated restaurant data
    return res.status(200).json({
      success: true,
      data: homelyFood,
      totalHomelyFoodCenter,
      totalPages: Math.ceil(totalHomelyFoodCenter / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving homelyFood",
    });
  }
};

const updateHomelyFood = async (req, res) => {
  const { id } = req.params; // Assuming you're passing the restaurant ID in the URL
  const { error } = homelyFoodValidation.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details.map(detail => detail.message) });
  }

  try {
    // Check if the restaurant exists
    const existingHomelyFood = await HomelyFood.findById(id);
    if (!existingHomelyFood) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check if the updated name already exists for another restaurant
    if (req.body.homelyFoodCenterName) {
      const duplicateRestaurant = await HomelyFood.findOne({
        homelyFoodCenterName: req.body.homelyFoodCenterName,
        _id: { $ne: id }, // Exclude the current restaurant from the search
      });
      if (duplicateRestaurant) {
        return res.status(400).json({ error: 'Homely food with this name already exists' });
      }
    }

    // Update restaurant details
    Object.assign(existingHomelyFood, req.body); // Merge updates into the existing restaurant
    await existingHomelyFood.save();

    res.status(200).json({ message: 'Restaurant updated successfully', restaurant: existingHomelyFood });

  } catch (err) {
    // Handling duplicate key error from MongoDB unique index
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Restaurant with this name already exists' });
    }
    res.status(500).json({ error: 'Error updating restaurant', details: err.message });
  }
};


const addRoomService = async (req, res) => {
  try {
    const { error } = validateRoomService.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const existingRoomService = await RoomService.findOne({
      serviceTitle: req.body.serviceName,
    });
    if (existingRoomService) {
      return res
        .status(400)
        .json({ message: "Service with this name already exists" });
    }

    const newRoomService = new RoomService({
      serviceTitle: req.body.serviceName,
      description: req.body.description,
      amount: req.body.amount,
    });

    await newRoomService.save();
    res.status(201).json({
      success: true,
      message: "Room service created successfully",
      roomService: newRoomService,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


const updateRoomService = async (req, res) => {
  try {
    const { error } = validateRoomService.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params;

    // Check if a amenity with the same name exists (excluding the current amenity)
    const existingAmenity = await RoomService.findOne({
      serviceTitle: req.body.serviceName,
      _id: { $ne: id },
    });

    if (existingAmenity) {
      return res
        .status(400)
        .json({ message: "Room service with this name already exists" });
    }

    // Update the amenity
    const updatedRoomService = await RoomService.findByIdAndUpdate(
      id,
      {
        serviceTitle: req.body.serviceName,
        description: req.body.description,
        amount: req.body.amount,
      },
      { new: true }
    );

    if (!updatedRoomService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({
      success: true,
      message: "Amenity updated successfully",
      service: updatedRoomService,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }

};

const getRoomServices = async (req, res) => {
  try {
    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;

    const searchQuery = searchParams
      ? { serviceTitle: { $regex: searchParams, $options: "i" } }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    const totalServices = await RoomService.countDocuments(searchQuery);

    const services = await RoomService.find(searchQuery)
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1, _id: 1 });

    if (!services.length) {
      return res.status(404).json({
        success: false,
        message: "No service found",
      });
    }

    return res.status(200).json({
      success: true,
      data: services,
      totalServices,
      totalPages: Math.ceil(totalServices / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving services"
    });
  }
};


const addRides = async (req, res) => {
  try {
    const { error } = validateRoomService.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const existingRoomService = await Rides.findOne({
      serviceTitle: req.body.serviceName,
    });
    if (existingRoomService) {
      return res
        .status(400)
        .json({ message: "Service with this name already exists" });
    }

    const newRoomService = new Rides({
      serviceTitle: req.body.serviceName,
      description: req.body.description,
      amount: req.body.amount,
    });

    await newRoomService.save();
    res.status(201).json({
      success: true,
      message: "Room service created successfully",
      roomService: newRoomService,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateRides = async (req, res) => {
  try {
    const { error } = validateRoomService.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params;

    // Check if a amenity with the same name exists (excluding the current amenity)
    const existingAmenity = await Rides.findOne({
      serviceTitle: req.body.serviceName,
      _id: { $ne: id },
    });
    if (existingAmenity) {
      return res
        .status(400)
        .json({ message: "Room service with this name already exists" });
    }

    // Update the amenity
    const updatedRoomService = await Rides.findByIdAndUpdate(
      id,
      {
        serviceTitle: req.body.serviceName,
        description: req.body.description,
        amount: req.body.amount,
      },
      { new: true }
    );

    if (!updatedRoomService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({
      success: true,
      message: "Amenity updated successfully",
      service: updatedRoomService,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }

};

const getRides = async (req, res) => {
  try {
    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;

    const searchQuery = searchParams
      ? { serviceTitle: { $regex: searchParams, $options: "i" } }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    const totalServices = await Rides.countDocuments(searchQuery);

    const services = await Rides.find(searchQuery)
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1, _id: 1 });

    if (!services.length) {
      return res.status(404).json({
        success: false,
        message: "No service found",
      });
    }

    return res.status(200).json({
      success: true,
      data: services,
      totalServices,
      totalPages: Math.ceil(totalServices / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving services"
    });
  }
};


const addEntertainment = async (req, res) => {
  try {
    const { error } = validateRoomService.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const existingRoomService = await Entertainment.findOne({
      serviceTitle: req.body.serviceName,
    });
    if (existingRoomService) {
      return res
        .status(400)
        .json({ message: "Service with this name already exists" });
    }

    const newRoomService = new Entertainment({
      serviceTitle: req.body.serviceName,
      description: req.body.description,
      amount: req.body.amount,
    });

    await newRoomService.save();
    res.status(201).json({
      success: true,
      message: "Room service created successfully",
      roomService: newRoomService,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateEntertainment = async (req, res) => {
  try {
    const { error } = validateRoomService.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params;



    // Check if a amenity with the same name exists (excluding the current amenity)
    const existingAmenity = await Entertainment.findOne({
      serviceTitle: req.body.serviceName,
      _id: { $ne: id },
    });



    if (existingAmenity) {
      return res
        .status(400)
        .json({ message: "Room service with this name already exists" });
    }

    // Update the amenity
    const updatedRoomService = await Entertainment.findByIdAndUpdate(
      id,
      {
        serviceTitle: req.body.serviceName,
        description: req.body.description,
        amount: req.body.amount,
      },
      { new: true }
    );

    if (!updatedRoomService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({
      success: true,
      message: "Amenity updated successfully",
      service: updatedRoomService,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }

};

const getEntertainment = async (req, res) => {
  try {
    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;

    const searchQuery = searchParams
      ? { serviceTitle: { $regex: searchParams, $options: "i" } }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    const totalServices = await Entertainment.countDocuments(searchQuery);

    const services = await Entertainment.find(searchQuery)
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1, _id: 1 });

    if (!services.length) {
      return res.status(404).json({
        success: false,
        message: "No service found",
      });
    }

    return res.status(200).json({
      success: true,
      data: services,
      totalServices,
      totalPages: Math.ceil(totalServices / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving services"
    });
  }
};

const addOtherService = async (req, res) => {
  try {
    const { error } = validateRoomService.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const existingRoomService = await OtherService.findOne({
      serviceTitle: req.body.serviceName,
    });
    if (existingRoomService) {
      return res
        .status(400)
        .json({ message: "Service with this name already exists" });
    }

    const newRoomService = new OtherService({
      serviceTitle: req.body.serviceName,
      description: req.body.description,
      amount: req.body.amount,
    });

    await newRoomService.save();
    res.status(201).json({
      success: true,
      message: "Room service created successfully",
      roomService: newRoomService,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateOtherService = async (req, res) => {
  try {
    const { error } = validateRoomService.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params;



    // Check if a amenity with the same name exists (excluding the current amenity)
    const existingAmenity = await OtherService.findOne({
      serviceTitle: req.body.serviceName,
      _id: { $ne: id },
    });



    if (existingAmenity) {
      return res
        .status(400)
        .json({ message: "Room service with this name already exists" });
    }

    // Update the amenity
    const updatedRoomService = await OtherService.findByIdAndUpdate(
      id,
      {
        serviceTitle: req.body.serviceName,
        description: req.body.description,
        amount: req.body.amount,
      },
      { new: true }
    );

    if (!updatedRoomService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({
      success: true,
      message: "Amenity updated successfully",
      service: updatedRoomService,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }

};

const getOtherService = async (req, res) => {
  try {
    const { pagePerData = 100, pageNumber = 1, searchParams = "" } = req.body;

    const searchQuery = searchParams
      ? { serviceTitle: { $regex: searchParams, $options: "i" } }
      : {};

    const skip = (pageNumber - 1) * pagePerData;

    const totalServices = await OtherService.countDocuments(searchQuery);

    const services = await OtherService.find(searchQuery)
      .skip(skip)
      .limit(parseInt(pagePerData))
      .sort({ createdAt: -1, _id: 1 });

    if (!services.length) {
      return res.status(404).json({
        success: false,
        message: "No service found",
      });
    }

    return res.status(200).json({
      success: true,
      data: services,
      totalServices,
      totalPages: Math.ceil(totalServices / pagePerData),
      currentPage: pageNumber,
      pageSize: pagePerData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving services"
    });
  }
};


const getAllServices = async (req, res) => {
  const { city } = req.query


  try {
    // Fetch all data in parallel
    const [restaurants, homelyFood, rides, otherServices, entertainment, roomService] = await Promise.all([
      Restaurant.find({
        city: city
      }),
      HomelyFood.find({
        city: city
      }),
      Rides.find(),
      OtherService.find(),
      Entertainment.find(),
      RoomService.find()
    ]);

    // Combine the result into one object
    const result = {
      restaurants,
      homelyFood,
      rides,
      otherService: otherServices,
      entertainment,
      roomService
    };

    // Send response
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const updateHomeStayAddOns = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurants, homelyFood, rides, otherService, entertainment, roomService } = req.body;

    // Validate if ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Homestay ID" });
    }

    // Find and update homestay with new service references
    const updatedHomestay = await Homestay.findByIdAndUpdate(
      id,
      {
        restaurants,
        homelyfoods: homelyFood,
        rides,
        otherservice: otherService,
        entertainments: entertainment,
        roomservice: roomService
      },
      { new: true, runValidators: true }
    );

    if (!updatedHomestay) {
      return res.status(404).json({ error: "Homestay not found" });
    }

    res.status(200).json({ message: "Homestay services updated successfully", data: updatedHomestay });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}


const sendCheckInReminders = async () => {
  try {

    const now = new Date();
    const tomorrow = new Date(now.setDate(now.getDate() + 1));

    const startOfDayUTC = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfDayUTC = new Date(tomorrow.setHours(23, 59, 59, 999));


    // Fetch bookings for the next day
    const bookings = await Booking.find({
      checkIn: { $gte: startOfDayUTC, $lt: endOfDayUTC },
      isCancelled: false,
    })
      .populate('userId')
      .populate('homestayId');



    if (bookings.length === 0) {
      return;
    }

    // Send emails for each booking
    // for (const booking of bookings) {
    //   if (booking.userId && booking.userId.email) {
    //     await sendEmail(booking.userId.email, booking);
    //   } else {
    //     console.warn(`No email found for user of booking ${booking._id}`);
    //   }
    // }

  } catch (error) {
    console.error('Error in cron job:', error);
  }
};


const initiateRefund = async (req, res) => {
  const { id } = req.params;

  try {
    // First, find the booking without updating it
    const booking = await Booking.findById(id).populate("homestayId");

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


    if (booking.isRefunded) {
      return res.status(400).json({
        success: false,
        message: 'Refund is already processed'
      });
    }

    // Check if payment exists
    if (booking.paymentId && booking.orderId) {
      try {
        // Process refund through Razorpay
        const refund = await razorpay.payments.refund(booking.paymentId, {
          amount: booking.homestayId?.pricePerNight * 100, // Convert to paise
          notes: {
            bookingId: id,
            orderId: booking.orderId,
            homestayId: booking.homestayId?._id,
            reason: 'Admin refund - caution deposit'
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
          id,
          {
            isRefunded: true,
            refundId: refund.id,
            refundAmount: booking.amount,
            refundedAt: new Date()
          },
          { new: true }
        );

        return res.status(200).json({
          success: true,
          message: 'Refunding is processed',
          booking: updatedBooking,
          refund: {
            id: refund.id,
            amount: refund.amount / 100 // Convert back to rupees for display
          }
        });

      } catch (refundError) {
        return res.status(400).json({
          success: false,
          message: 'Failed to process refund',
          error: refundError.message
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

//ID PROOF MANDATORY CONTROL - ADMIN
const updateIdProofControl = async (req, res) => {
  try {
    const { error } = validateIdProofControl.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { disclaimerNote, isIdProofMandatory } = req.body;
    const updatedSettings = await IdProofControl.findOneAndUpdate(
      {},
      { disclaimerNote, isIdProofMandatory, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Id proof settings updated successfully.",
      data: {
        disclaimerNote: updatedSettings.disclaimerNote,
        isIdProofMandatory: updatedSettings.isIdProofMandatory
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while updating settings.",
      error: error.message,
    });
  }
};

//FETCH ID PROOF MANDATORY STATUS
const getIdProofMandatoryStatus = async (req, res) => {
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
      message: "Error fetching admin settings.",
      error: error.message,
    });
  }
};

//ADMIN - DYNAMIC CANCELLATION POLICY UPDATE
const updateCancellationPolicy = async (req, res) => {
  try {
    const { homestayId } = req.params;

    // Validate request body
    const { error } = validateCancellationPolicy.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { cancellationPolicy } = req.body;


    // Find and update homestay
    const updatedHomestay = await Homestay.findByIdAndUpdate(
      homestayId,
      { cancellationPolicy, updatedAt: new Date() },
      { new: true, upsert: false }
    );

    if (!updatedHomestay) {
      return res.status(404).json({ success: false, message: "Homestay not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Cancellation policy updated successfully.",
      data: updatedHomestay.cancellationPolicy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while updating cancellation policy.",
      error: error.message,
    });
  }
};


module.exports = {
  adminSignUp,
  adminOtpVerify,
  adminLogin,
  adminLogout,
  addCategory,
  updateCategory,
  toggleCategoryStatus,
  addHomestay,
  updateHomestay,
  toggleHomestayStatus,
  getHomestayById,
  getAllHomestays,
  getAllCategories,
  adminResendOtp,
  addAmenities,
  updateAmenity,
  toggleAmenityStatus,
  getAllAmenities,
  getAllUsers,
  getUserById,
  toggleUserStatus,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  getAllCoupons,
  getAllBookings,
  reorderImages,
  sendCheckInReminders,
  getMonthlyReport,
  getHomeStaywiseReport,
  getCategoryWiseReport,
  getYearlyReport,
  getOverallReport,
  addRestaurent,
  getAllRestaurants,
  updateRestaurant,
  addHomelyFood,
  updateHomelyFood,
  getAllHomelyFood,
  addRoomService,
  updateRoomService,
  getRoomServices,
  addRides,
  getRides,
  updateRides,
  addEntertainment,
  updateEntertainment,
  getEntertainment,
  addOtherService,
  updateOtherService,
  getOtherService,
  getAllServices,
  updateHomeStayAddOns,
  initiateRefund,
  updateIdProofControl,
  getIdProofMandatoryStatus,
  updateCancellationPolicy,
};
