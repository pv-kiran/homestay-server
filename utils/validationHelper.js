const Joi = require('joi')

const validateAdminSignup = Joi.object({
    name: Joi.string()
        .min(4)
        .max(40)
        .messages({
            "any.required": "Name is required",
        }),
    email: Joi.string()
        .email({ minDomainSegments: 2})
        .messages({
            "any.required": "Email is required",
            "string.email": "Invalid email format",
        }),
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$'))
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
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$'))
        .required()
        .messages({
            "any.required": "Password is required",
        })
})


module.exports = {
    validateAdminSignup,
    validateAdminLogin,
}