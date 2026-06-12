import express from 'express';
import { getChatHistory, getChatContacts } from '../Controllers/ChatController.js';
import { protect, admin } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

router.get('/history/:userId', protect, getChatHistory);
router.get('/contacts', protect, admin, getChatContacts);

export default router;
