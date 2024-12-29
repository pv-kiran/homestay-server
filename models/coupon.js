const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'], // Discount can be either a percentage or a fixed amount
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    maxDiscount: {
      type: Number,
      default: null, // Maximum discount value (for percentage discounts)
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null, // Maximum number of times the coupon can be used globally
    },
    usageCount: {
      type: Number,
      default: 0, // Tracks how many times the coupon has been used globally
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    //   required: true,
    },
    userRestrictions: {
      type: Map, // Tracks usage per user
      of: Number,
      default: {}, // e.g., { "userId1": 1, "userId2": 2 }
    },
},
{
    timestamps: true,  
});
  
module.exports = mongoose.model('Coupon', couponSchema);