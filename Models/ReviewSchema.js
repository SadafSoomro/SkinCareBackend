import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Review must belong to a product']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must have an author']
    },
    userName: {
        type: String,
        required: [true, 'Review must have an author name']
    },
    rating: {
        type: Number,
        required: [true, 'Review must have a star rating (1-5)'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Review must have a comment/description'],
        trim: true
    }
}, { timestamps: true });

// Ensure a user can only review a product once
reviewSchema.index({ productId: 1, user: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
