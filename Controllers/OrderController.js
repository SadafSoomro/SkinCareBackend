import Order from '../Models/OrderSchema.js';
import sendEmail from '../Utils/sendEmail.js';

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

        try {
            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #e21b26; padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 24px;">makskin</h2>
                    </div>
                    <div style="padding: 20px;">
                        <h3 style="color: #333;">Order Confirmation</h3>
                        <p style="color: #555;">Thank you for your order! Your order has been successfully placed.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
                            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                            <p style="margin: 5px 0;"><strong>Grand Total:</strong> Rs. ${order.grandTotal}</p>
                        </div>

                        <h4 style="color: #333; border-bottom: 1px solid #eaeaea; padding-bottom: 8px;">Shipping Details</h4>
                        <p style="color: #555; margin: 5px 0;">${shippingInfo.firstName} ${shippingInfo.lastName}</p>
                        <p style="color: #555; margin: 5px 0;">${shippingInfo.address}, ${shippingInfo.city}</p>
                        <p style="color: #555; margin: 5px 0;">${shippingInfo.phone}</p>
                        ${shippingInfo.email ? `<p style="color: #555; margin: 5px 0;">${shippingInfo.email}</p>` : ''}
                        
                        <p style="color: #555; margin-top: 20px;">We will notify you once your order is shipped.</p>
                    </div>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; color: #888; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} Makskin. All rights reserved.
                    </div>
                </div>
            `;
            await sendEmail({
                email: req.user.email || shippingInfo.email,
                subject: 'Order Confirmation - Makskin',
                message: `Thank you for your order! Your tracking number is ${order.trackingNumber}. Grand Total: Rs. ${order.grandTotal}`,
                html: emailHtml
            });
        } catch (emailError) {
            console.error("Failed to send order confirmation email:", emailError);
        }

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
