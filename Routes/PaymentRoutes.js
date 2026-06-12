import express from 'express';
import { getPaymentConfig, createPaymentIntent } from '../Controllers/PaymentController.js';
import { protect } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/create-intent', protect, createPaymentIntent);

export default router;
