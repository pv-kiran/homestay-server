const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
    amenityName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    iconUrl: {
        type: String,
    },
    isDisabled: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true,
    });


module.exports = mongoose.model('Amenity', amenitySchema);