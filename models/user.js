const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    otp : {
        type: Number 
    },
    otpExpiry: {
        type: Date
    },
    isMarketingAllowed: {
        type: Boolean,
        default: false
    },
    dob: {
        type: Date
    },
    accountCreationStatus: {
        type: Boolean,
        default: false
    },
    isDisabled: {
        type: Boolean,
        default: false
    },
    address: {
        street: {
            type: String,
            // required: true,
        },
        city: {
            type: String,
            // required: true,
        },
        district: {
            type: String,
            // required: true,
        },
        state: {
            type: String,
            // required: true,
        },
        zip: {
            type: String,
            // required: true,
        },
        country: {
            type: String,
            // required: true, 
        },
    },
    phone: {
        type: Number,
        // required: true,
    },
    gender: {
        type: String, 
        enum: ["Male", "Female", "Other"], 
        // required: true, 
    },
    profilePic: {
        type: String,
    }
},
{
    timestamps: true,  
})


module.exports = mongoose.model('User', userSchema);