const mongoose = require('mongoose');

// Define the schema for menu items
const menuItemSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner'],
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
});



// Define the schema for the restaurant
const homelyFoodSchema = new mongoose.Schema({
    homelyFoodCenterName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    menuItems: [menuItemSchema],
    city: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create the Restaurant model
const HomelyFood = mongoose.model('HomelyFood', homelyFoodSchema);

module.exports = HomelyFood;
