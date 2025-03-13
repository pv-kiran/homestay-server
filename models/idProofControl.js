const mongoose = require('mongoose');

const IdProofControlSchema = new mongoose.Schema({
    disclaimerNote: {
        type: String,
        required: true,
        default: "Please carry a valid government ID during check-in.",
    },
    isIdProofMandatory: {
        type: Boolean,
        required: true,
        default: false,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
},
{ timestamps: true }
);


module.exports = mongoose.model('IdProofControl', IdProofControlSchema);