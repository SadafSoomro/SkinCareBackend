import express from 'express';
import { getAllOrders, updateOrderStatus, deleteOrder, createOrder, getMyOrders, cancelMyOrder } from '../Controllers/OrderController.js';
import { protect, admin } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, admin, getAllOrders);
router.get('/my-orders', protect, getMyOrders);
router.put('/my-orders/:id/cancel', protect, cancelMyOrder);
router.put('/:id', protect, admin, updateOrderStatus);
router.delete('/:id', protect, admin, deleteOrder);

export default router;
