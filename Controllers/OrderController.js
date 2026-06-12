import Order from '../Models/OrderSchema.js';

// @desc    Create order
// @route   POST /orders
// @access  Private
export const createOrder = async (req, res) => {
    try {
        const { trackingNumber, items, subtotal, discountAmount, discountPercent, promoCode, shippingFee, grandTotal, paymentMethod, shippingInfo } = req.body;

        const order = await Order.create({
            trackingNumber,
            user: req.user._id,
            items: (items || []).map(item => ({
                productId: String(item.id || item.productId),
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

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /orders/:id
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const { status } = req.body;
        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        order.status = status;
        const updated = await order.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete order
// @route   DELETE /orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        await Order.deleteOne({ _id: order._id });
        res.json({ message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel order (only if pending)
// @route   PUT /orders/my-orders/:id/cancel
// @access  Private
export const cancelMyOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Ensure user owns the order
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending orders can be cancelled' });
        }

        order.status = 'cancelled';
        const updated = await order.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
