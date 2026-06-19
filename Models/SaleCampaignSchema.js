import mongoose from 'mongoose';

const saleCampaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a campaign name'],
        trim: true
    },
    discountPercentage: {
        type: Number,
        required: [true, 'Please provide a discount percentage'],
        min: [1, 'Discount cannot be less than 1%'],
        max: [99, 'Discount cannot exceed 99%']
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide an end date']
    },
    targetType: {
        type: String,
        enum: ['all', 'specific', 'percentage'],
        default: 'all'
    },
    percentageOfProducts: {
        type: Number,
        min: 1,
        max: 100,
        default: null
    },
    appliedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('SaleCampaign', saleCampaignSchema);
