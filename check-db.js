import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './Models/ProductSchema.js';
import Category from './Models/CategorySchema.js';
import Banner from './Models/BannerSchema.js';
import { connectDB } from './Utils/db.js';

dotenv.config();

const checkDB = async () => {
    try {
        await connectDB();
        const products = await Product.find().limit(2);
        const categories = await Category.find().limit(2);
        const banners = await Banner.find().limit(2);

        console.log('--- PRODUCTS ---');
        console.log(JSON.stringify(products.map(p => ({ name: p.name, main_image: p.main_image, images: p.images })), null, 2));
        console.log('--- CATEGORIES ---');
        console.log(JSON.stringify(categories.map(c => ({ name: c.name, img: c.img, image: c.image })), null, 2));
        console.log('--- BANNERS ---');
        console.log(JSON.stringify(banners.map(b => ({ title: b.title, image: b.image })), null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
