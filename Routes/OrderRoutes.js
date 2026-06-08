import express from 'express';
import { getAllOrders, updateOrderStatus, deleteOrder, createOrder } from '../Controllers/OrderController.js';
import { protect, admin } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, admin, getAllOrders);
router.put('/:id', protect, admin, updateOrderStatus);
router.delete('/:id', protect, admin, deleteOrder);

export default router;
