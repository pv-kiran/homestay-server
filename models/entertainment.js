const mongoose = require('mongoose');

const entertainmentSchema = new mongoose.Schema({
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


module.exports = mongoose.model('Entertainmnet', entertainmentSchema);