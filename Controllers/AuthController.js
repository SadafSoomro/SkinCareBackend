import User from '../Models/UserSchema.js';
import PendingUser from '../Models/PendingUserSchema.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../Utils/sendEmail.js';

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
        user.email = req.body.email || user.email;
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
        success: true,
        message: 'Password reset successful',
        token: generateToken(user._id)
    });
};
