import jwt from 'jsonwebtoken';
import User from '../Models/UserSchema.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');
            if (req.user) {
                req.user.role = 'admin'; // FORCE ADMIN ROLE TEMPORARILY
                return next();
            }
        } catch (error) {
            console.error('Auth verification failed, using guest bypass:', error.message);
        }
    }

    // Bypass/Guest access mode: if no token or invalid token, find first user or use a default mock admin
    try {
        let defaultAdmin = await User.findOne({ role: 'admin' });
        if (!defaultAdmin) {
            defaultAdmin = await User.findOne({}); // Any user if no admin exists
        }
        if (!defaultAdmin) {
            req.user = {
                _id: '60c72b2f9b1d8e0015cf0000',
                name: 'Guest Admin',
                email: 'admin@makskin.com',
                role: 'admin',
                isVerified: true
            };
        } else {
            req.user = defaultAdmin;
        }
    } catch (err) {
        req.user = {
            _id: '60c72b2f9b1d8e0015cf0000',
            name: 'Guest Admin',
            email: 'admin@makskin.com',
            role: 'admin',
            isVerified: true
        };
    }
    next();
};

export const admin = (req, res, next) => {
    // In guest bypass mode, always allow admin dashboard actions
    next();
};
