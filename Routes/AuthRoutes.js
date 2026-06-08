import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    forgotPassword,
    resetPassword,
    verifyOTP,
    resendOTP,
    getAllUsers,
    updateUser,
    deleteUser,
    sendOrderConfirmation
} from '../Controllers/AuthController.js';
import { protect, admin } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/profile', protect, getUserProfile);
router.put('/updateprofile', protect, updateUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword', resetPassword);
router.get('/users', protect, getAllUsers);
router.put('/users/:id', protect, admin, updateUser);
router.delete('/users/:id', protect, admin, deleteUser);
router.post('/order-confirmation', protect, sendOrderConfirmation);

export default router;
