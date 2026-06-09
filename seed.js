import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './Utils/db.js';
import Category from './Models/CategorySchema.js';
import Banner from './Models/BannerSchema.js';
import Product from './Models/ProductSchema.js';

dotenv.config();

const categoryData = [
  { name: 'Baby Cream & Lotion', img: 'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=200&h=200&fit=crop', tab: 'babycare' },
  { name: 'Baby Shampoo', img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&h=200&fit=crop', tab: 'babycare' },
  { name: 'Liquid Lipsticks', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200&h=200&fit=crop', tab: 'makeup' },
  { name: 'Sunscreen', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop', tab: 'skincare' },
  { name: 'Shampoo & Conditioner', img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&h=200&fit=crop', tab: 'haircare' },
  { name: 'Foundation', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop', tab: 'makeup' },
  { name: 'Mascara', img: 'https://images.unsplash.com/photo-1631214524020-3c69888b8f2c?w=200&h=200&fit=crop', tab: 'makeup' },
  { name: 'Hair Treatment', img: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=200&h=200&fit=crop', tab: 'haircare' },
  { name: 'Lip Liners', img: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&h=200&fit=crop', tab: 'makeup' },
  { name: 'Masks & Peels', img: 'https://images.unsplash.com/photo-1620916566395-044f9003ced4?w=200&h=200&fit=crop', tab: 'skincare' },
  { name: 'Face Wash & Cleansers', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop', tab: 'skincare' },
  { name: 'Makeup Remover', img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&h=200&fit=crop', tab: 'skincare' },
  { name: 'Nail Polish', img: 'https://images.unsplash.com/photo-1639739502660-84c205ad88df?w=200&h=200&fit=crop', tab: 'makeup' },
  { name: 'Lip Balm & Mask', img: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=200&h=200&fit=crop', tab: 'makeup' },
  { name: 'Body Wash', img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=200&h=200&fit=crop', tab: 'skincare' },
  { name: 'Primer', img: 'https://images.unsplash.com/photo-1615396879814-4901929c543f?w=200&h=200&fit=crop', tab: 'makeup' },
  { name: 'Candle', img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=200&h=200&fit=crop', tab: 'candle' },
  { name: 'Concealers', img: 'https://images.unsplash.com/photo-1615396879555-d41599874a77?w=200&h=200&fit=crop', tab: 'makeup' },
  { name: 'Hair Dye', img: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=200&h=200&fit=crop', tab: 'haircare' },
  { name: 'Serums', img: 'https://images.unsplash.com/photo-1620916566395-044f9003ced4?w=200&h=200&fit=crop', tab: 'skincare' },
];

const bannerSlides = [
  {
    title: 'THE ORDINARY',
    description: 'Sincerity in Formulation',
    image: 'https://images.unsplash.com/photo-1620916566395-044f9003ced4?w=1600&h=580&fit=crop',
  },
  {
    title: 'REVOLUTION',
    description: 'POUT LIP OIL',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1600&h=580&fit=crop',
  },
  {
    title: 'CeraVe',
    description: 'HYDRATING MOISTURIZER',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1600&h=580&fit=crop',
  },
  {
    title: 'BIOAQUA',
    description: 'AVOCADO EYE MASK',
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=1600&h=580&fit=crop',
  },
  {
    title: 'LOREAL PARIS',
    description: 'REVITALIFT SERUM',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=1600&h=580&fit=crop',
  },
];

const storeProducts = [
  {
    brand: 'OneStop',
    name: 'Hot Air Brush',
    categoryTab: 'haircare',
    main_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
    price: 4400,
    originalPrice: 5500,
    is_featured: true,
  },
  {
    brand: 'ST London',
    name: 'Dual Wet & Dry Compact Powder',
    categoryTab: 'makeup',
    main_image: 'https://images.unsplash.com/photo-1631214524020-3c69888b8f2c?w=400&h=400&fit=crop',
    price: 2760,
    originalPrice: 3450,
    is_featured: true,
  },
  {
    brand: 'AXIS-Y',
    name: 'Dark Spot Correcting Glow Serum — 50ml',
    categoryTab: 'skincare',
    main_image: 'https://images.unsplash.com/photo-1620916566395-044f9003ced4?w=400&h=400&fit=crop',
    price: 4000,
    originalPrice: 5000,
    is_featured: true,
  },
  {
    brand: 'Medicube',
    name: 'Collagen Night Wrapping Mask — 75ml',
    categoryTab: 'skincare',
    main_image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    price: 5020,
    originalPrice: 6275,
    is_featured: true,
  },
  {
    brand: 'CeraVe',
    name: 'Foaming Facial Cleanser',
    categoryTab: 'skincare',
    main_image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop',
    price: 3200,
    originalPrice: 4000,
    is_featured: true,
  },
  {
    brand: 'The Ordinary',
    name: 'Niacinamide 10% + Zinc 1% — 30ml',
    categoryTab: 'skincare',
    main_image: 'https://images.unsplash.com/photo-1620916566395-044f9003ced4?w=400&h=400&fit=crop',
    price: 1800,
    originalPrice: 2250,
    is_featured: false,
  },
  {
    brand: 'Dr. Althea',
    name: '345 Relief Cream — 50ml',
    categoryTab: 'skincare',
    main_image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop',
    price: 3600,
    originalPrice: 4500,
    is_featured: false,
  },
  {
    brand: 'COSRX',
    name: 'Advanced Snail 96 Mucin Power Essence — 100ml',
    categoryTab: 'skincare',
    main_image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    price: 3900,
    originalPrice: 4875,
    is_featured: false,
  },
  {
    brand: 'Framesi',
    name: 'Morphosis Re-Structure Shampoo — 250ml',
    categoryTab: 'haircare',
    main_image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop',
    price: 2800,
    originalPrice: 3500,
    is_featured: false,
  },
  {
    brand: "L'Oreal",
    name: 'Serie Expert Absolut Repair Mask — 250ml',
    categoryTab: 'haircare',
    main_image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&h=400&fit=crop',
    price: 4200,
    originalPrice: 5250,
    is_featured: false,
  },
  {
    brand: 'Gosh',
    name: 'Hair Treatment Oil — 50ml',
    categoryTab: 'haircare',
    main_image: 'https://images.unsplash.com/photo-1522351015484-76f2c417b36a?w=400&h=400&fit=crop',
    price: 2400,
    originalPrice: 3000,
    is_featured: false,
  },
  {
    brand: 'Maybelline',
    name: 'SuperStay Matte Ink Liquid Lipstick',
    categoryTab: 'makeup',
    main_image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop',
    price: 1900,
    originalPrice: 2375,
    is_featured: false,
  },
  {
    brand: 'ST London',
    name: 'Matte Liquid Concealer',
    categoryTab: 'makeup',
    main_image: 'https://images.unsplash.com/photo-1615396879814-4901929c543f?w=400&h=400&fit=crop',
    price: 1500,
    originalPrice: 1875,
    is_featured: false,
  },
  {
    brand: 'CeraVe',
    name: 'Baby Wash & Shampoo — 237ml',
    categoryTab: 'babycare',
    main_image: 'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=400&h=400&fit=crop',
    price: 2900,
    originalPrice: 3625,
    is_featured: false,
  },
  {
    brand: 'Babi Mild',
    name: 'Baby Cream & Lotion',
    categoryTab: 'babycare',
    main_image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop',
    price: 1600,
    originalPrice: 2000,
    is_featured: false,
  },
];

const seedDB = async () => {
    try {
        await connectDB();
        console.log('Database connected. Clearing old data...');

        // Uncomment if you want to wipe everything before seeding
        // await Category.deleteMany();
        // await Banner.deleteMany();
        // await Product.deleteMany();

        console.log('Seeding categories...');
        const createdCategories = [];
        for (const cat of categoryData) {
            let existingCat = await Category.findOne({ name: cat.name });
            if (!existingCat) {
                existingCat = await Category.create({ name: cat.name, description: cat.tab, image: cat.img });
            }
            createdCategories.push({ tab: cat.tab, id: existingCat._id });
        }

        console.log('Seeding banners...');
        for (const ban of bannerSlides) {
            const existingBan = await Banner.findOne({ title: ban.title });
            if (!existingBan) {
                await Banner.create({ title: ban.title, description: ban.description, image: ban.image });
            }
        }

        console.log('Seeding products...');
        for (let i = 0; i < storeProducts.length; i++) {
            const prod = storeProducts[i];
            const cat = createdCategories.find(c => c.tab === prod.categoryTab) || createdCategories[0];
            
            const slug = prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + i;
            const sku = 'SKU-' + Math.random().toString(36).substr(2, 6).toUpperCase();

            const existingProd = await Product.findOne({ name: prod.name });
            if (!existingProd) {
                await Product.create({
                    name: prod.name,
                    slug: slug,
                    description: prod.name + ' - Authentic product by ' + prod.brand,
                    price: prod.price,
                    discount_price: prod.originalPrice,
                    stock_quantity: 50,
                    sku: sku,
                    category_id: cat.id,
                    brand: prod.brand,
                    main_image: prod.main_image,
                    is_featured: prod.is_featured,
                    status: 'active'
                });
            }
        }

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding DB:', error);
        process.exit(1);
    }
};

seedDB();
