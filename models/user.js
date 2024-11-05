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
})


module.exports = mongoose.model('User', userSchema);