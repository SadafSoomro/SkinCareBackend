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
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const { status } = req.body;
        if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const previousStatus = order.status;

        // Capture user info BEFORE save (populated data may be lost after save)
        const userEmail = order.user?.email || order.shippingInfo?.email;
        const userName = order.user?.name ||
            `${order.shippingInfo?.firstName || ''} ${order.shippingInfo?.lastName || ''}`.trim() ||
            'Valued Customer';
        const orderItems = order.items || [];
        const orderTracking = order.trackingNumber;
        const orderGrandTotal = order.grandTotal;
        const orderShippingFee = order.shippingFee;
        const orderPaymentMethod = order.paymentMethod;
        const orderShippingInfo = order.shippingInfo || {};

        order.status = status;
        const updated = await order.save();

        // Send email when order is confirmed or delivered by admin
        if ((status === 'confirmed' || status === 'delivered') && previousStatus !== status) {
            console.log(`[Email] Attempting to send ${status} email to: ${userEmail}`);
            try {
                const itemsHtml = orderItems.map(item => `
                    <tr>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">${item.name}</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #666; text-align: center;">x${item.quantity}</td>
                        <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333; font-weight: 700; text-align: right;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                `).join('');

                const statusLabel = status === 'confirmed' ? 'Confirmed' : 'Dispatched';
                const statusColor = status === 'confirmed' ? '#2563eb' : '#22c55e';
                const statusMessage = status === 'confirmed'
                    ? 'Great news! Your order has been confirmed by our team and is being prepared for shipment.'
                    : 'Your order has been dispatched and is on its way to you!';

                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
                        <div style="background: linear-gradient(135deg, #e21b26 0%, #a01015 100%); padding: 30px 24px; text-align: center;">
                            <h1 style="margin: 0; color: #fff; font-size: 26px; font-weight: 800;">makskin</h1>
                            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Your Beauty Destination</p>
                        </div>

                        <div style="padding: 28px 24px 0; text-align: center;">
                            <div style="display: inline-block; background: ${statusColor}22; border: 2px solid ${statusColor}; border-radius: 30px; padding: 8px 24px; margin-bottom: 16px;">
                                <span style="color: ${statusColor}; font-weight: 700; font-size: 15px;">Order ${statusLabel}!</span>
                            </div>
                            <h2 style="margin: 0 0 8px; color: #1a1a1a; font-size: 20px;">Hi ${userName}!</h2>
                            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">${statusMessage}</p>
                        </div>

                        <div style="margin: 24px 24px 0; background: #f9f9f9; border-radius: 10px; padding: 16px 20px;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="color: #888; font-size: 13px; padding: 4px 0;">Tracking Number</td>
                                    <td style="color: #e21b26; font-weight: 700; font-size: 13px; font-family: monospace; text-align: right;">${orderTracking}</td>
                                </tr>
                                <tr>
                                    <td style="color: #888; font-size: 13px; padding: 4px 0;">Payment</td>
                                    <td style="color: #333; font-weight: 600; font-size: 13px; text-align: right;">${(orderPaymentMethod || 'cod').toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td style="color: #888; font-size: 13px; padding: 4px 0;">Shipping</td>
                                    <td style="color: #333; font-weight: 600; font-size: 13px; text-align: right;">${orderShippingFee === 0 ? 'FREE' : 'Rs. ' + Number(orderShippingFee).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="border-top: 1px solid #e0e0e0; padding-top: 4px;"></td>
                                </tr>
                                <tr>
                                    <td style="color: #333; font-weight: 700; font-size: 15px; padding-top: 8px;">Grand Total</td>
                                    <td style="color: #e21b26; font-weight: 800; font-size: 17px; text-align: right; padding-top: 8px;">Rs. ${Number(orderGrandTotal).toLocaleString()}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="margin: 20px 24px 0;">
                            <p style="font-weight: 700; color: #1a1a1a; font-size: 14px; margin: 0 0 10px;">Items Ordered</p>
                            <table style="width: 100%; border-collapse: collapse; border: 1px solid #f0f0f0;">
                                <thead>
                                    <tr style="background: #f5f5f5;">
                                        <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #666;">Product</th>
                                        <th style="padding: 8px 12px; text-align: center; font-size: 12px; color: #666;">Qty</th>
                                        <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #666;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>${itemsHtml}</tbody>
                            </table>
                        </div>

                        ${orderShippingInfo.address ? `
                        <div style="margin: 20px 24px 0;">
                            <p style="font-weight: 700; color: #1a1a1a; font-size: 14px; margin: 0 0 8px;">Shipping To</p>
                            <p style="margin: 0; color: #555; font-size: 13px; line-height: 1.8;">
                                ${orderShippingInfo.firstName || ''} ${orderShippingInfo.lastName || ''}<br/>
                                ${orderShippingInfo.address}, ${orderShippingInfo.city || ''}<br/>
                                ${orderShippingInfo.phone || ''}
                            </p>
                        </div>` : ''}

                        <div style="margin: 28px 0 0; background: #f5f5f5; padding: 18px 24px; text-align: center;">
                            <p style="margin: 0; color: #888; font-size: 12px;">Thank you for shopping with Makskin!</p>
                            <p style="margin: 6px 0 0; color: #aaa; font-size: 11px;">© ${new Date().getFullYear()} Makskin. All rights reserved.</p>
                        </div>
                    </div>
                `;

                if (userEmail) {
                    await sendEmail({
                        email: userEmail,
                        subject: status === 'confirmed' ? `Order Confirmed - Makskin (#${orderTracking})` : `Order Dispatched - Makskin (#${orderTracking})`,
                        message: status === 'confirmed'
                            ? `Your order #${orderTracking} has been confirmed. Grand Total: Rs. ${orderGrandTotal}`
                            : `Your order #${orderTracking} has been dispatched. Grand Total: Rs. ${orderGrandTotal}`,
                        html: emailHtml
                    });
                    console.log(`[Email] Successfully sent to ${userEmail}`);
                } else {
                    console.warn('[Email] No email address found for order:', order._id.toString());
                }
            } catch (emailError) {
                console.error(`[Email] Failed to send ${status} email:`, emailError.message);
            }
        }

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
