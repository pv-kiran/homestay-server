const Joi = require('joi');

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
            'number.min': 'OTP must be a 4-digit number',
            'number.max': 'OTP must be a 4-digit number',
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

const validateUserSignup = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2})
        .required()
        .messages({
            "any.required": "Email is required",
            "string.email": "Invalid email format",
        })       
})



module.exports = {
    validateAdminSignup,
    validateAdminLogin,
    validateOtp,
    validateCategory,
    validateUserSignup
}