const mongoose = require('mongoose');

const otherServiceSchema = new mongoose.Schema({
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


module.exports = mongoose.model('OtherService', otherServiceSchema);