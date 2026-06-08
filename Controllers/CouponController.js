import Coupon from '../Models/CouponSchema.js';

// @desc    Get all coupons (admin gets all, users get active only)
// @route   GET /coupons
// @access  Private
export const getAllCoupons = async (req, res) => {
    try {
        let coupons;
        if (req.user?.role === 'admin') {
            coupons = await Coupon.find({}).sort({ createdAt: -1 });
        } else {
            coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 });
        }
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create coupon
// @route   POST /coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
    try {
        const { code, discountPercent, description, isActive, expiresAt } = req.body;

        const existing = await Coupon.findOne({ code: code?.toUpperCase().trim() });
        if (existing) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        const coupon = await Coupon.create({
            code: code?.toUpperCase().trim(),
            discountPercent,
            description,
            isActive,
            expiresAt: expiresAt || null,
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update coupon
// @route   PUT /coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        const { code, discountPercent, description, isActive, expiresAt } = req.body;
        coupon.code = code?.toUpperCase().trim() || coupon.code;
        coupon.discountPercent = discountPercent ?? coupon.discountPercent;
        coupon.description = description ?? coupon.description;
        coupon.isActive = isActive ?? coupon.isActive;
        coupon.expiresAt = expiresAt !== undefined ? (expiresAt || null) : coupon.expiresAt;

        const updated = await coupon.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete coupon
// @route   DELETE /coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        await Coupon.deleteOne({ _id: coupon._id });
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate coupon code
// @route   POST /coupons/validate
// @access  Public
export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'Please provide a coupon code' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or inactive coupon code' });
        }

        // Check expiry
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return res.status(400).json({ message: 'This coupon has expired' });
        }

        res.json({
            valid: true,
            code: coupon.code,
            discountPercent: coupon.discountPercent,
            description: coupon.description,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
