import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    short_description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount_price: {
        type: Number,
        min: 0
    },
    stock_quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    sku: {
        type: String,
        required: true,
        unique: true
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    skin_type: {
        type: [String],
        default: []
    },
    concerns: {
        type: [String],
        default: []
    },
    ingredients: {
        type: String,
        default: ''
    },
    how_to_use: {
        type: String,
        default: ''
    },
    benefits: {
        type: String,
        default: ''
    },
    main_image: {
        type: String,
        required: true
    },
    gallery_images: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    meta_title: {
        type: String,
        default: ''
    },
    meta_description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
