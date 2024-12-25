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
            nearByLatitude: {
                type: Number,
                required: true,
            },
            nearByLongitude: {
                type: Number,
                required: true,
            },
        },
    },
    amenities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Amenity',
        // required: true, 
    }],
    noOfRooms: {
        type: Number,
        required: true,
    },
    noOfBathRooms: {
        type: Number,
        required: true,
    },
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
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isDisabled: {
        type: Boolean,
        default: false
    },
})

module.exports = mongoose.model('Homestay', homestaySchema);