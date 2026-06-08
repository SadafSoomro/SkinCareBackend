import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
    productId: { type: String },
    name: { type: String, required: true },
    brand: { type: String },
    img: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    trackingNumber: {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    promoCode: { type: String, default: '' },
    shippingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ['cod', 'card', 'bank'],
        default: 'cod',
    },
    shippingInfo: {
        address: String,
        city: String,
        zipCode: String,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending',
    },
}, {
    timestamps: true,
});

export default mongoose.model('Order', OrderSchema);
