import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const PendingUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    otpExpire: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Auto-delete after 10 minutes (matching OTP expiry)
PendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export default mongoose.model('PendingUser', PendingUserSchema);
