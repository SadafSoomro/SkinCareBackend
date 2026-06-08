import express from 'express';
import {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
} from '../Controllers/CouponController.js';
import { protect, admin } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/validate', validateCoupon);
router.get('/', protect, getAllCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;
