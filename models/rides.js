const mongoose = require('mongoose');

const ridesSchema = new mongoose.Schema({
    serviceTitle: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    amount: {
        type: Number
    }
},
    {
        timestamps: true,
    }
);


module.exports = mongoose.model('Rides', ridesSchema);