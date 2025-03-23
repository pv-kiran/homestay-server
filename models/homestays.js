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
        proximityCity: {
            type: String
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
    provider: {
        type: String,
        required: true
    },
    insuranceAmount: {
        type: Number,
        required: true
    },
    gst: {
        type: Number,
        required: true
    },
    insuranceDescription: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isDisabled: {
        type: Boolean,
        default: false
    },
    restaurants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',  // Reference to the Restaurant model
    }],
    homelyfoods: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HomelyFood', // Reference to the Entertainment model
    }],
    entertainments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entertainmnet', // Reference to the Entertainment model
    }],
    rides: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rides', // Reference to the Entertainment model
    }],
    roomservice: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomService', // Reference to the Entertainment model
    }],
    otherservice: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OtherService', // Reference to the Entertainment model
    }],
    cancellationPolicy: [
        {
            policyName: {
                type: String,
            },
            hoursBeforeCheckIn: {
                type: Number,
                required: true,
            },
            refundPercentage: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
            }
        }
    ]
})

module.exports = mongoose.model('Homestay', homestaySchema);