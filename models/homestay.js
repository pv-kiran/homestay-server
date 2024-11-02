const mongoose = require('mongoose');

//HOTEL POLICIES SCHEMA
const hotelPoliciesSchema = new mongoose.Schema({
    checkInTime: {
        type: String,
        required: true,
    },
    checkOutTime: {
        type: String,
        required: true,
    },
    guestPolicies: {
        type: [String], 
        // required: true,
    },
});

const homestaySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    address: {
        street: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        zip: {
            type: String,
            required: true,
        },
        coordinates: {
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
        },
    },
    amenities: [String], 
    pricePerNight: {
        type: Number,
        required: true,
    },
    maxGuests: {
        type: Number,
        required: true,
    },
    images: [String],
    hotelPolicies: hotelPoliciesSchema,
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('Homestay', homestaySchema);