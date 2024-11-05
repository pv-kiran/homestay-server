const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
    amenityName: {
        type: String,
        required: true
    },
    iconUrl: {
        type: String,
    },
    isDisabled: {
        type: Boolean,
        default: false
    }
})


module.exports = mongoose.model('Amenity', amenitySchema);