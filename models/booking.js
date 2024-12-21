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
    amount: {
        type: Number,
        required: true,
    },
    paymentId: {
        type: String,
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },
    isCheckedIn: {
        type: Boolean,
        default: false,
    },
    isCheckedOut: {
        type: Boolean,
        default: false,
    },
    isCancelled: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Booking', bookingSchema);
