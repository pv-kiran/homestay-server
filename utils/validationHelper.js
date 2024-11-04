const Joi = require('joi');
const mongoose = require('mongoose');

const validateAdminSignup = Joi.object({
    name: Joi.string()
        .min(4)
        .max(40)
        .required()
        .messages({
            "any.required": "Name is required",
        }),
    email: Joi.string()
        .email({ minDomainSegments: 2})
        .required()
        .messages({
            "any.required": "Email is required",
            "string.email": "Invalid email format",
        }),
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$'))
        .required()
        .messages({
            "any.required": "Password is required",
            "string.pattern.base": "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character",
        }),        
})

const validateAdminLogin = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2})
        .required()
        .messages({
            "any.required": "Email is required",
            "string.email": "Invalid email format",
        }),
    password: Joi.string()
        .required()
        .messages({
            "any.required": "Password is required",
        })
})

const validateOtp = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Invalid email format'
        }),
    otp: Joi.number()
        .integer()
        .min(100000)
        .max(999999)
        .required()
        .messages({
            'number.base': 'OTP must be a number',
            'number.min': 'OTP must be a 6-digit number',
            'number.max': 'OTP must be a 6-digit number',
            'any.required': 'OTP is required'
        })
})

const validateCategory = Joi.object({
    categoryName: Joi.string()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.base': 'Category name should be a string',
            'string.empty': 'Category name cannot be empty',
            'string.min': 'Category name should have a minimum length of 3',
            'string.max': 'Category name should have a maximum length of 30',
            'any.required': 'Category name is required',
        }),
})

const validateHomestay = Joi.object({
    title: Joi.string().required().messages({
        'any.required': 'Title is required.',
        'string.base': 'Title should be a string',
        'string.empty': 'Title cannot be empty',
        'string.min': 'Title should have a minimum length of 3',
    }),
    description: Joi.string().required().messages({
        'any.required': 'Description is required.',
        'string.base': 'Description should be a string',
        'string.empty': 'Description cannot be empty',
        'string.min': 'Description should have a minimum length of 3',
    }),
    address: Joi.object({
        street: Joi.string().required().messages({
            'any.required': 'Street address is required.',
            'string.empty': 'Street address cannot be empty',
        }),
        city: Joi.string().required().messages({
            'any.required': 'City is required.',
            'string.empty': 'City cannot be empty',
        }),
        district: Joi.string().required().messages({
            'any.required': 'District is required.',
            'string.empty': 'District cannot be empty',
        }),
        state: Joi.string().required().messages({
            'any.required': 'State is required.',
            'string.empty': 'State cannot be empty',
        }),
        zip: Joi.string().required().messages({
            'any.required': 'ZIP code is required.',
            'string.empty': 'ZIP code cannot be empty',
        }),
        coordinates: Joi.object({
            latitude: Joi.number().required().messages({
                'number.base': 'Latitude must be a number.',
                'any.required': 'Latitude is required.'
            }),
            longitude: Joi.number().required().messages({
                'number.base': 'Longitude must be a number.',
                'any.required': 'Longitude is required.'
            }),
        }).required().messages({
            'any.required': 'Coordinates are required.'
        }),
    }).required().messages({
        'any.required': 'Address is required.'
    }),
    amenities: Joi.array().items(
        Joi.object({
            title: Joi.string().required(),
            icon: Joi.string().uri().optional()
        })
    ).required().messages({
        'any.required': 'Amenities are required.',
    }),
    noOfRooms: Joi.number().integer().required().messages({
        'number.base': 'Number of rooms must be a number.',
        'any.required': 'Number of rooms is required.'
    }),
    noOfBathRooms: Joi.number().integer().required().messages({
        'number.base': 'Number of bathrooms must be a number.',
        'any.required': 'Number of bathrooms is required.'
    }),
    pricePerNight: Joi.number().required().messages({
        'number.base': 'Price per night must be a number.',
        'any.required': 'Price per night is required.'
    }),
    maxGuests: Joi.number().integer().required().min(1).messages({
        'number.base': 'Maximum number of guests must be a number.',
        'any.required': 'Maximum number of guests is required.'
    }),
    // images: Joi.array().items(Joi.string()).optional(),
    hotelPolicies: Joi.object({
        checkInTime: Joi.string().required().messages({
            'string.empty': 'Check-in time is required.',
            'any.required': 'Check-in time is required.'
        }),
        checkOutTime: Joi.string().required().messages({
            'string.empty': 'Check-out time is required.',
            'any.required': 'Check-out time is required.'
        }),
        guestPolicies: Joi.array().items(Joi.string()).optional()
    }).required().messages({
        'any.required': 'Hotel policies are required.'
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
            'any.required': 'Category is required.',
            'string.empty': 'Category is required.',
        })
})

const validateUserSignup = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2})
        .required()
        .messages({
            "any.required": "Email is required",
            "string.email": "Invalid email format",
        })       
})

// Custom ObjectId validation rule
const objectIdValidation = (value, helpers) => {
    if (!mongoose.isValidObjectId(value)) {
        return helpers.message('Invalid ID format');
    }
    return value;
};

const validateHomestayId = Joi.object({
    homestayId: Joi.string().custom(objectIdValidation).required()
});

module.exports = {
    validateAdminSignup,
    validateAdminLogin,
    validateOtp,
    validateCategory,
    validateHomestay,
    validateUserSignup,
    validateHomestayId
}