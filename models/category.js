const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: {
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


module.exports = mongoose.model('Category', categorySchema);