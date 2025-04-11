const mongoose = require('mongoose');

const selectedItemSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    type: {
        type: String, // For food items (e.g., "breakfast", "lunch")
    },
    parentName: {
        type: String, // For restaurants/homelyFoods
    },
    description: {
        type: String, // For other services like room service, rides, etc.
    },
});

// Define the structure for selectedItems (grouping by category)
const selectedItemsSchema = new mongoose.Schema({
    restaurants: {
        type: Map,
        of: selectedItemSchema, // Store restaurant items using their ID as keys
        default: {},
    },
    homelyFoods: {
        type: Map,
        of: selectedItemSchema,
        default: {},
    },
    otherServices: {
        type: Map,
        of: selectedItemSchema,
        default: {},
    },
    roomServices: {
        type: Map,
        of: selectedItemSchema,
        default: {},
    },
    rides: {
        type: Map,
        of: selectedItemSchema,
        default: {},
    },
    entertainments: {
        type: Map,
        of: selectedItemSchema,
        default: {},
    },
});

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
    },
    discountedPrice: {
        type: Number,
    },
    couponCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
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
    selectedItems: {
        type: selectedItemsSchema,
        required: true,
    },
    addOns: {
        type: selectedItemsSchema,
        required: true,
    },
    cancelledAt: {
        type: Date
    },
    isRefunded: {
        type: Boolean,
        default: false
    },
    refundId: {
        type: String,
    },
    refundedAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    guests: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('Booking', bookingSchema);
