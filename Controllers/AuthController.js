import User from '../Models/UserSchema.js';
import PendingUser from '../Models/PendingUserSchema.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../Utils/sendEmail.js';
import Order from '../Models/OrderSchema.js';

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, password, phone, role } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate 6 digit code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = Date.now() + 10 * 60 * 1000;

        // Save to PendingUser
        await PendingUser.findOneAndUpdate(
            { email },
            { name, email, password, phone, otp, otpExpire },
            { upsert: true, new: true }
        );

        // Send Email
        const message = `Welcome to SkinCare! Your verification code is: ${otp}. It will expire in 10 minutes.`;
        console.log(`Registration OTP for ${email}: ${otp}`);

        try {
            await sendEmail({
                email,
                subject: 'SkinCare - Email Verification',
                message
            });

            res.status(201).json({
                success: true,
                message: 'Verification code sent to email'
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP for registration
// @route   POST /auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const pendingUser = await PendingUser.findOne({ 
            email,
            otp,
            otpExpire: { $gt: Date.now() }
        });

        if (!pendingUser) {
            return res.status(400).json({ message: 'Invalid or expired code' });
        }

        // Create the real user
        const user = await User.create({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            phone: pendingUser.phone,
            isVerified: true
        });

        // Delete from PendingUser
        await PendingUser.deleteOne({ _id: pendingUser._id });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isVerified: user.isVerified,
                token: generateToken(user._id),
            });
        } else {
            // Check if user is in PendingUser
            const pendingUser = await PendingUser.findOne({ email });
            if (pendingUser) {
                // Generate new OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                pendingUser.otp = otp;
                pendingUser.otpExpire = Date.now() + 10 * 60 * 1000;
                await pendingUser.save();

                console.log(`Resent Verification OTP for ${email}: ${otp}`);

                await sendEmail({
                    email,
                    subject: 'SkinCare - Email Verification',
                    message: `Your verification code is: ${otp}`
                });

                return res.status(401).json({ 
                    message: 'Please verify your email. A new code has been sent.',
                    notVerified: true
                });
            }

            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        // email is locked and cannot be updated
        user.phone = req.body.phone || user.phone;
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Forgot password (sends OTP)
// @route   POST /auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Get OTP
    const otp = user.getOTP();

    await user.save({ validateBeforeSave: false });

    const message = `Your password reset code is: ${otp}. It will expire in 10 minutes.`;

    console.log(`Password Reset OTP for ${req.body.email}: ${otp}`);

    try {
        await sendEmail({
            email: user.email,
            subject: 'SkinCare - Password Reset Code',
            message
        });

        res.status(200).json({ 
            success: true, 
            message: 'Reset code sent to email' 
        });
    } catch (err) {
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

// @desc    Reset password (using OTP)
// @route   PUT /auth/resetpassword
// @access  Public
export const resetPassword = async (req, res) => {
    const { email, otp, password } = req.body;

    const user = await User.findOne({
        email,
        otp,
        otpExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Set new password
    user.password = password;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.isVerified = true; // Mark as verified if they successfully reset password

    await user.save();

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id),
        message: 'Password reset successful'
    });
};

// @desc    Resend OTP for registration
// @route   POST /auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        const pendingUser = await PendingUser.findOne({ email });
        if (!pendingUser) {
            return res.status(404).json({ message: 'No pending registration found for this email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        pendingUser.otp = otp;
        pendingUser.otpExpire = Date.now() + 10 * 60 * 1000;
        await pendingUser.save();

        console.log(`Resent Verification OTP for ${email}: ${otp}`);

        await sendEmail({
            email,
            subject: 'SkinCare - Email Verification',
            message: `Your verification code is: ${otp}. It will expire in 10 minutes.`
        });

        res.status(200).json({ success: true, message: 'Verification code resent to email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /auth/users
// @access  Private
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /auth/users/:id
// @access  Private
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user by admin
// @route   PUT /auth/users/:id
// @access  Private
export const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.role = req.body.role || user.role;
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send order confirmation email
// @route   POST /auth/order-confirmation
// @access  Private
export const sendOrderConfirmation = async (req, res) => {
    const { orderTrackingNumber, cartItems, subtotal, discountAmount, discountPercent, promoCode, shippingFee, grandTotal, paymentMethod, shippingInfo } = req.body;

    try {
        const user = req.user;
        const recipientEmail = shippingInfo?.email || user?.email || 'admin@makskin.com';
        const recipientName = shippingInfo?.name || user?.name || 'Customer';

        if (!user && !recipientEmail) {
            return res.status(404).json({ message: 'User not found and no email provided' });
        }

        // Save order to database
        try {
            await Order.create({
                trackingNumber: orderTrackingNumber,
                user: req.user._id,
                items: (cartItems || []).map(item => ({
                    productId: String(item.id),
                    name: item.name,
                    brand: item.brand || '',
                    img: item.img || '',
                    price: item.price,
                    quantity: item.quantity,
                })),
                subtotal: Number(subtotal),
                discountAmount: Number(discountAmount) || 0,
                discountPercent: Number(discountPercent) || 0,
                promoCode: promoCode || '',
                shippingFee: Number(shippingFee) || 0,
                grandTotal: Number(grandTotal),
                paymentMethod: paymentMethod || 'cod',
                shippingInfo: shippingInfo || {},
                status: 'pending',
            });
        } catch (orderErr) {
            console.error('Failed to save order to DB:', orderErr.message);
            // Don't block the email — just log
        }

        const paymentLabel =
            paymentMethod === 'cod' ? 'Cash on Delivery (COD)' :
            paymentMethod === 'card' ? 'Credit / Debit Card' : 'Bank Transfer';

        const itemRows = (cartItems || []).map(item => `
            <tr>
                <td style="padding:10px 8px;border-bottom:1px solid #f0e6d3;">
                    <strong>${item.name}</strong><br/>
                    <small style="color:#888;">${item.brand}</small>
                </td>
                <td style="padding:10px 8px;border-bottom:1px solid #f0e6d3;text-align:center;">${item.quantity}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #f0e6d3;text-align:right;">Rs.${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
        `).join('');

        const htmlMessage = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Order Confirmation</title>
        </head>
        <body style="margin:0;padding:0;background:#fdf8f3;font-family:'Segoe UI',Arial,sans-serif;">
            <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 32px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px;font-weight:800;">makskin</h1>
                    <p style="color:#e8b89a;margin:8px 0 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Premium Beauty &amp; Skincare</p>
                </div>
                <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:20px 32px;">
                    <h2 style="color:#16a34a;margin:0 0 4px;font-size:18px;">&#x2705; Order Confirmed!</h2>
                    <p style="color:#555;margin:0;font-size:14px;">Your order has been successfully placed and is being processed.</p>
                </div>
                <div style="padding:28px 32px;">
                    <p style="color:#444;font-size:15px;margin:0 0 20px;">Hi <strong>${recipientName}</strong>, thank you for shopping with us! &#x1F389;</p>
                    <div style="background:#fdf8f3;border-radius:12px;padding:20px;margin-bottom:24px;">
                        <table style="width:100%;border-collapse:collapse;">
                            <tr>
                                <td style="padding:6px 0;color:#888;font-size:13px;">Order ID</td>
                                <td style="padding:6px 0;text-align:right;font-weight:700;color:#1a1a2e;font-size:14px;">${orderTrackingNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding:6px 0;color:#888;font-size:13px;">Payment</td>
                                <td style="padding:6px 0;text-align:right;font-weight:600;color:#444;font-size:13px;">${paymentLabel}</td>
                            </tr>
                            <tr>
                                <td style="padding:6px 0;color:#888;font-size:13px;">Estimated Delivery</td>
                                <td style="padding:6px 0;text-align:right;font-weight:600;color:#444;font-size:13px;">3 - 5 Business Days</td>
                            </tr>
                            ${shippingInfo ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;">Ship To</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#444;font-size:13px;">${shippingInfo.address}, ${shippingInfo.city}</td></tr>` : ''}
                        </table>
                    </div>
                    <h3 style="color:#1a1a2e;font-size:15px;margin:0 0 12px;border-bottom:2px solid #f0e6d3;padding-bottom:8px;">Order Items</h3>
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#fdf8f3;">
                                <th style="padding:10px 8px;text-align:left;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;">Product</th>
                                <th style="padding:10px 8px;text-align:center;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;">Qty</th>
                                <th style="padding:10px 8px;text-align:right;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${itemRows}</tbody>
                    </table>
                    <div style="margin-top:20px;border-top:2px solid #f0e6d3;padding-top:16px;">
                        <table style="width:100%;border-collapse:collapse;">
                            <tr>
                                <td style="padding:5px 0;color:#666;font-size:13px;">Subtotal</td>
                                <td style="padding:5px 0;text-align:right;color:#444;font-size:13px;">Rs.${Number(subtotal).toLocaleString()}</td>
                            </tr>
                            ${Number(discountAmount) > 0 ? `<tr><td style="padding:5px 0;color:#16a34a;font-size:13px;">Discount (${discountPercent}%${promoCode ? ` "${promoCode}"` : ''})</td><td style="padding:5px 0;text-align:right;color:#16a34a;font-size:13px;">- Rs.${Number(discountAmount).toLocaleString()}</td></tr>` : ''}
                            <tr>
                                <td style="padding:5px 0;color:#666;font-size:13px;">Shipping</td>
                                <td style="padding:5px 0;text-align:right;color:#444;font-size:13px;">${Number(shippingFee) === 0 ? 'FREE' : `Rs.${Number(shippingFee).toLocaleString()}`}</td>
                            </tr>
                            <tr style="border-top:2px solid #e5e7eb;">
                                <td style="padding:12px 0 5px;color:#1a1a2e;font-size:16px;font-weight:700;">Total Paid</td>
                                <td style="padding:12px 0 5px;text-align:right;color:#1a1a2e;font-size:18px;font-weight:800;">Rs.${Number(grandTotal).toLocaleString()} PKR</td>
                            </tr>
                        </table>
                    </div>
                    <p style="color:#888;font-size:13px;margin:24px 0 0;text-align:center;">Questions? Contact our support team. We will keep you updated on your shipment.</p>
                </div>
                <div style="background:#1a1a2e;padding:20px 32px;text-align:center;">
                    <p style="color:#888;margin:0;font-size:12px;">&#169; 2026 Makskin. All rights reserved.</p>
                    <p style="color:#666;margin:6px 0 0;font-size:11px;">100% Authentic Products &#x2022; Easy Returns &#x2022; Secure Payment</p>
                </div>
            </div>
        </body>
        </html>`;

        try {
            await sendEmail({
                email: recipientEmail,
                subject: `Makskin - Order Confirmed! (${orderTrackingNumber})`,
                message: `Your order ${orderTrackingNumber} has been placed successfully. Total: Rs.${Number(grandTotal).toLocaleString()} PKR.`,
                html: htmlMessage
            });
            res.status(200).json({ success: true, message: 'Order confirmation email sent' });
        } catch (emailError) {
            console.error('Order confirmation email error:', emailError.message);
            // Email failed but order is placed
            res.status(200).json({ success: true, message: 'Order placed successfully, but email could not be sent' });
        }
    } catch (error) {
        console.error('Order processing error:', error.message);
        res.status(500).json({ message: 'Could not process order', error: error.message });
    }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google Login
// @route   POST /auth/google-login
// @access  Public
export const googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, sub } = ticket.getPayload();
        
        let user = await User.findOne({ email });
        
        if (!user) {
            user = await User.create({
                name,
                email,
                password: crypto.randomBytes(16).toString('hex'),
                phone: '0000000000',
                isVerified: true
            });
        }
        
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ message: 'Invalid Google Token' });
    }
};
