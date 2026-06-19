import express from 'express';
import {
    getProductReviews,
    checkReviewEligibility,
    createReview
} from '../Controllers/ReviewController.js';
import { protect } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

// Fetch reviews for a specific product
router.get('/:productId', getProductReviews);

// Check review eligibility
router.get('/:productId/eligibility', protect, checkReviewEligibility);

// Submit a review
router.post('/:productId', protect, createReview);

export default router;
