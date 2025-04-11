const Joi = require("joi");
const mongoose = require("mongoose");

const validateAdminSignup = Joi.object({
  name: Joi.string().min(4).max(40).required().messages({
    "any.required": "Name is required",
  }),
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format",
  }),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$"
      )
    )
    .required()
    .messages({
      "any.required": "Password is required",
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character",
    }),
});

const validateAdminLogin = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const validateEmail = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format",
  }),
});

const validateOtp = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
  }),
  otp: Joi.number().integer().min(100000).max(999999).required().messages({
    "number.base": "OTP must be a number",
    "number.min": "OTP must be a 6-digit number",
    "number.max": "OTP must be a 6-digit number",
    "any.required": "OTP is required",
  }),
});

const validateCategory = Joi.object({
  categoryName: Joi.string().min(3).max(30).required().messages({
    "string.base": "Category name should be a string",
    "string.empty": "Category name cannot be empty",
    "string.min": "Category name should have a minimum length of 3",
    "string.max": "Category name should have a maximum length of 30",
    "any.required": "Category name is required",
  }),
});

const validateAmenity = Joi.object({
  amenityName: Joi.string().min(3).max(30).required().messages({
    "string.base": "Amenity name should be a string",
    "string.empty": "Amenity name cannot be empty",
    "string.min": "Amenity name should have a minimum length of 3",
    "string.max": "Amenity name should have a maximum length of 30",
    "any.required": "Amenity name is required",
  }),
  description: Joi.string().min(3).max(30).required().messages({
    "string.base": "Description should be a string",
    "string.empty": "Description cannot be empty",
    "string.min": "Description should have a minimum length of 5",
    "string.max": "Description should have a maximum length of 10",
    "any.required": "Description is required",
  }),
});

const validateHomestay = Joi.object({
  title: Joi.string().required().messages({
    "any.required": "Title is required.",
    "string.base": "Title should be a string",
    "string.empty": "Title cannot be empty",
    "string.min": "Title should have a minimum length of 3",
  }),
  description: Joi.string().required().messages({
    "any.required": "Description is required.",
    "string.base": "Description should be a string",
    "string.empty": "Description cannot be empty",
    "string.min": "Description should have a minimum length of 3",
  }),
  address: Joi.object({
    street: Joi.string().required().messages({
      "any.required": "Street address is required.",
      "string.empty": "Street address cannot be empty",
    }),
    city: Joi.string().required().messages({
      "any.required": "City is required.",
      "string.empty": "City cannot be empty",
    }),
    proximityCity: Joi.string().required().messages({
      "any.required": "City is required.",
      "string.empty": "City cannot be empty",
    }),
    district: Joi.string().required().messages({
      "any.required": "District is required.",
      "string.empty": "District cannot be empty",
    }),
    state: Joi.string().required().messages({
      "any.required": "State is required.",
      "string.empty": "State cannot be empty",
    }),
    zip: Joi.string().required().messages({
      "any.required": "ZIP code is required.",
      "string.empty": "ZIP code cannot be empty",
    }),
    coordinates: Joi.object({
      latitude: Joi.number().required().messages({
        "number.base": "Latitude must be a number.",
        "any.required": "Latitude is required.",
      }),
      longitude: Joi.number().required().messages({
        "number.base": "Longitude must be a number.",
        "any.required": "Longitude is required.",
      }),
      nearByLatitude: Joi.number().required().messages({
        "number.base": "Latitude must be a number.",
        "any.required": "Latitude is required.",
      }),
      nearByLongitude: Joi.number().required().messages({
        "number.base": "Longitude must be a number.",
        "any.required": "Longitude is required.",
      }),
    })
      .required()
      .messages({
        "any.required": "Coordinates are required.",
      }),
  })
    .required()
    .messages({
      "any.required": "Address is required.",
    }),
  homestayImages: Joi.array().items(Joi.string()).optional(),
  amenityIds: Joi.array()
    .items(
      Joi.string()
        .required()
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.message("Invalid Amenity ID format.");
          }
          return value;
        })
    )
    .required()
    .messages({
      "array.base": "Amenities must be an array.",
      "any.required": "At least one amenity is required.",
    }),
  noOfRooms: Joi.number().integer().required().messages({
    "number.base": "Number of rooms must be a number.",
    "any.required": "Number of rooms is required.",
  }),
  noOfBathRooms: Joi.number().integer().required().messages({
    "number.base": "Number of bathrooms must be a number.",
    "any.required": "Number of bathrooms is required.",
  }),
  pricePerNight: Joi.number().required().messages({
    "number.base": "Price per night must be a number.",
    "any.required": "Price per night is required.",
  }),
  maxGuests: Joi.number().integer().required().min(1).messages({
    "number.base": "Maximum number of guests must be a number.",
    "any.required": "Maximum number of guests is required.",
  }),
  // images: Joi.array().items(Joi.string()).optional(),
  hotelPolicies: Joi.object({
    checkInTime: Joi.string().required().messages({
      "string.empty": "Check-in time is required.",
      "any.required": "Check-in time is required.",
    }),
    checkOutTime: Joi.string().required().messages({
      "string.empty": "Check-out time is required.",
      "any.required": "Check-out time is required.",
    }),
    guestPolicies: Joi.array().items(Joi.string()).optional(),
  })
    .required()
    .messages({
      "any.required": "Hotel policies are required.",
    }),
  categoryId: Joi.string()
    .required()
    .custom((value, helpers) => {
      // Check if value is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("Invalid Category ID format.");
      }
      return value;
    })
    .messages({
      "any.required": "Category is required.",
      "string.empty": "Category is required.",
    }),
  insuranceAmount: Joi.number().integer().required().messages({
    "number.base": "Insurance amount must be a number.",
    "any.required": "Insurance amount is required.",
  }),
  provider: Joi.string().required().messages({
    "any.required": "Insurance provider is required.",
    "string.base": "Insurance provider should be a string",
    "string.empty": "Insurance provider cannot be empty",
    "string.min": "Insurance provider should have a minimum length of 3",
  }),
  insuranceDescription: Joi.string().required().messages({
    "any.required": "Insurance Description is required.",
    "string.base": "Insurance Description should be a string",
    "string.empty": "Insurance Description cannot be empty",
    "string.min": "Insurance Description should have a minimum length of 3",
  }),
  gst: Joi.number().integer().required().messages({
    "number.base": "GST  must be a number.",
    "any.required": "GST  is required.",
  }),
});

const validateUserSignup = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format",
  }),
});

const is18OrOlder = (dob) => {
  const today = new Date();
  const dobDate = new Date(dob);
  const age = today.getFullYear() - dobDate.getFullYear();
  const monthDifference = today.getMonth() - dobDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dobDate.getDate())
  ) {
    return age - 1;
  }
  return age;
};

const userValidationSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    "any.required": "Full name is required",
    "string.empty": "Full name cannot be empty",
    "string.min": "Full name should have a minimum length of 2 characters",
    "string.max": "Full name should have a maximum length of 100 characters",
    "string.base": "Full name must be a string",
  }),

  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
  }),

  // dob: Joi.date()
  //   .iso()
  //   .required()
  //   .custom((value, helpers) => {
  //     if (is18OrOlder(value) < 18) {
  //       return helpers.message("User must be at least 18 years old");
  //     }
  //     return value;
  //   })
  //   .messages({
  //     "any.required": "Date of birth is required",
  //     "date.base": "Date of birth must be a valid date",
  //     "date.format": "Date of birth must be in ISO format (YYYY-MM-DD)",
  //   }),

  isMarketingAllowed: Joi.boolean().messages({
    "boolean.base":
      "Marketing preference must be a boolean value (true or false)",
  }),
});

// Custom ObjectId validation rule
const objectIdValidation = (value, helpers) => {
  if (!mongoose.isValidObjectId(value)) {
    return helpers.message("Invalid ID format");
  }
  return value;
};

const validateHomestayId = Joi.object({
  homestayId: Joi.string().custom(objectIdValidation).required(),
});

const validateUserId = Joi.object({
  userId: Joi.string().custom(objectIdValidation).required(),
});

const validateUserUpdate = Joi.object({
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    district: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.string().required(),
    country: Joi.string().required(),
  }),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  gender: Joi.string().valid("Male", "Female", "Other").required(),
  dob: Joi.number().required(),
});

const validateCreateCoupon = Joi.object({
  code: Joi.string().required().trim().messages({
    "string.empty": "Coupon code is required",
  }),
  description: Joi.string().required().messages({
    "any.required": "Description is required.",
    "string.base": "Description should be a string",
    "string.empty": "Description cannot be empty",
    "string.min": "Description should have a minimum length of 3",
  }),
  discountType: Joi.string().valid('percentage', 'fixed').required().messages({
    "any.only": "Discount type must be either 'percentage' or 'fixed'",
  }),
  discountValue: Joi.number().positive().required().messages({
    "number.base": "Discount value must be a number",
    "number.positive": "Discount value must be greater than 0",
  }),
  maxDiscount: Joi.number().positive().optional().messages({
    "number.base": "Max discount must be a number",
    "number.positive": "Max discount must be greater than 0",
  }),
  expiryDate: Joi.date().greater('now').required().messages({
    "date.base": "Expiry date must be a valid date",
    "date.greater": "Expiry date must be in the future",
  }),
  usageLimit: Joi.number().integer().positive().required().messages({
    "number.base": "Usage limit must be a number",
    "number.positive": "Usage limit must be greater than 0",
    "number.integer": "Usage limit must be an integer",
  }),
});

const validateUpdateCoupon = Joi.object({
  code: Joi.string().min(3).max(20).optional(),
  description: Joi.string().min(3).optional(),
  discountType: Joi.string().valid('percentage', 'fixed').optional(),
  discountValue: Joi.number().positive().optional(),
  maxDiscount: Joi.number().positive().optional(),
  expiryDate: Joi.date().greater('now').optional(),
  usageLimit: Joi.number().integer().positive().optional(),
  usageCount: Joi.number().integer().min(0).optional(),
});

const validateApplyCoupon = Joi.object({
  couponCode: Joi.string().required().messages({
    'any.required': 'Coupon code is required.',
    'string.base': 'Coupon code must be a string.',
  }),
  currencyCode: Joi.string().required().messages({
    'any.required': 'Coupon code is required.',
    'string.base': 'Coupon code must be a string.',
  }),
  homestayId: Joi.string().required().messages({
    'any.required': 'Homestay ID is required.',
    'string.base': 'Homestay ID must be a string.',
  }),
  numberOfDays: Joi.number().integer().min(1).required().messages({
    'any.required': 'Number of days is required.',
    'number.base': 'Number of days must be a number.',
    'number.min': 'Number of days must be at least 1.',
  }),
  insuranceAmount: Joi.number().optional().messages({
    'any.required': 'Insurance amount is required.',
  }),
  addOnAmount: Joi.number().optional().messages({
    'any.required': 'Number of days is required.',
  }),
  gst: Joi.number().optional().messages({
    'any.required': 'Insurance amount is required.',
  }),
});

const validateSubmitReview = Joi.object({
  homestayId: Joi.string().required().messages({
    'any.required': 'Homestay ID is required.',
    'string.base': 'Homestay ID must be a string.',
  }),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      "any.required": 'Rating must be an integer between 1 and 5.'
    }),
  reviewText: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      "any.required": 'Review text must be between 10 and 500 characters.'
    }),
})

const restaurantSchemaValidation = Joi.object({
  restaurantName: Joi.string().trim().required(),
  menuItems: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional(),
      type: Joi.string().valid('breakfast', 'lunch', 'dinner').required(),
      name: Joi.string().trim().required(),
      price: Joi.number().min(0).required()
    })
  ).required(),
  city: Joi.string().trim().required(),
});


const homelyFoodValidation = Joi.object({
  homelyFoodCenterName: Joi.string().trim().required(),
  menuItems: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional(),
      type: Joi.string().valid('breakfast', 'lunch', 'dinner').required(),
      name: Joi.string().trim().required(),
      price: Joi.number().min(0).required()
    })
  ).required(),
  city: Joi.string().trim().required(),
});

const validateRoomService = Joi.object({
  serviceName: Joi.string().min(3).max(30).required().messages({
    "string.base": "Service name should be a string",
    "string.empty": "Service name cannot be empty",
    "string.min": "Service name should have a minimum length of 3",
    "string.max": "Service name should have a maximum length of 30",
    "any.required": "Service name is required",
  }),
  description: Joi.string().min(3).max(30).required().messages({
    "string.base": "Description should be a string",
    "string.empty": "Description cannot be empty",
    "string.min": "Description should have a minimum length of 5",
    "string.max": "Description should have a maximum length of 10",
    "any.required": "Description is required",
  }),
  amount: Joi.number().integer().required().messages({
    "number.base": "Insurance amount must be a number.",
    "any.required": "Insurance amount is required.",
  }),
});

const validateIdProofControl = Joi.object({
  disclaimerNote: Joi.string().trim().min(10).max(500).required().messages({
    "string.empty": "Disclaimer note cannot be empty",
    "string.min": "Disclaimer note must be at least 10 characters",
    "string.max": "Disclaimer note cannot exceed 500 characters",
    "any.required": "Disclaimer note is required",
  }),
  isIdProofMandatory: Joi.boolean().required().messages({
    "any.required": "ID proof mandatory field is required.",
  }),
});

const validateCancellationPolicy = Joi.object({
  cancellationPolicy: Joi.array()
    .items(
      Joi.object({
        policyName: Joi.string().trim().required(),
        hoursBeforeCheckIn: Joi.number().min(0).required().messages({
          "number.base": "Hours before check-in must be a number",
          "number.min": "Hours before check-in cannot be negative",
          "any.required": "Hours before check-in is required",
        }),
        refundPercentage: Joi.number().min(0).max(100).required().messages({
          "number.base": "Refund percentage must be a number",
          "number.min": "Refund percentage cannot be negative",
          "number.max": "Refund percentage cannot exceed 100",
          "any.required": "Refund percentage is required",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one cancellation policy must be provided",
      "any.required": "Cancellation policy is required",
    }),
});


module.exports = {
  validateAdminSignup,
  validateAdminLogin,
  validateOtp,
  validateCategory,
  validateHomestay,
  validateUserSignup,
  userValidationSchema,
  validateHomestayId,
  validateEmail,
  validateAmenity,
  validateUserId,
  validateUserUpdate,
  validateCreateCoupon,
  validateUpdateCoupon,
  validateApplyCoupon,
  validateSubmitReview,
  restaurantSchemaValidation,
  homelyFoodValidation,
  validateRoomService,
  validateIdProofControl,
  validateCancellationPolicy,
};
