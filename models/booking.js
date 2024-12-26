const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    homestayId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homestay',
        required: true,
    },
    checkIn: {
        type: Date,
        required: true,
    },
    checkOut: {
        type: Date,
        required: true,
    },
    originalPrice: {
        type: Number,
        // required: true,
    },
    discountedPrice: {
        type: Number,
    },
    couponCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        // required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Booking', bookingSchema);
