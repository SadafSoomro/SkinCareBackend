import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please provide a coupon code'],
        unique: true,
        uppercase: true,
        trim: true,
    },
    discountPercent: {
        type: Number,
        required: [true, 'Please provide a discount percentage'],
        min: 1,
        max: 100,
    },
    description: {
        type: String,
        default: '',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

export default mongoose.model('Coupon', CouponSchema);
