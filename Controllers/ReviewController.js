import Review from '../Models/ReviewSchema.js';
import Order from '../Models/OrderSchema.js';
import Product from '../Models/ProductSchema.js';

// Get reviews for a product
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Check if user is eligible to review
export const checkReviewEligibility = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        // Check if user already reviewed
        const alreadyReviewed = await Review.findOne({ productId, user: userId });
        if (alreadyReviewed) {
            return res.status(200).json({ eligible: false, message: 'You have already reviewed this product.' });
        }

        // Check if there is a delivered order containing this product for this user
        const order = await Order.findOne({
            user: userId,
            status: 'delivered',
            'items.productId': productId
        });

        if (!order) {
            return res.status(200).json({ 
                eligible: false, 
                message: 'You can only review products you have purchased and that have been delivered.' 
            });
        }

        res.status(200).json({ eligible: true });
    } catch (error) {
        res.status(500).json({ message: 'Error checking eligibility', error: error.message });
    }
};

// Create a review
export const createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id;
        const userName = req.user.name;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Please provide a valid star rating between 1 and 5' });
        }
        if (!comment || comment.trim() === '') {
            return res.status(400).json({ message: 'Please write a review comment' });
        }

        // Verify eligibility
        const alreadyReviewed = await Review.findOne({ productId, user: userId });
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product.' });
        }

        const order = await Order.findOne({
            user: userId,
            status: 'delivered',
            'items.productId': productId
        });

        if (!order) {
            return res.status(403).json({ 
                message: 'You can only review products you have purchased and that have been delivered.' 
            });
        }

        const review = new Review({
            productId,
            user: userId,
            userName,
            rating,
            comment
        });

        await review.save();

        res.status(201).json({ message: 'Review added successfully', review });
    } catch (error) {
        res.status(500).json({ message: 'Error adding review', error: error.message });
    }
};
