import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './Models/ProductSchema.js';
import Category from './Models/CategorySchema.js';
import Banner from './Models/BannerSchema.js';
import { connectDB } from './Utils/db.js';

dotenv.config();

const countImages = async () => {
    try {
        await connectDB();
        
        const products = await Product.find();
        const prodCloudinary = products.filter(p => p.main_image?.includes('cloudinary.com'));
        console.log(`Products: ${products.length} total, ${prodCloudinary.length} cloudinary`);

        const categories = await Category.find();
        const catCloudinary = categories.filter(c => c.image?.includes('cloudinary.com') || c.img?.includes('cloudinary.com'));
        console.log(`Categories: ${categories.length} total, ${catCloudinary.length} cloudinary`);

        const banners = await Banner.find();
        const bannerCloudinary = banners.filter(b => b.image?.includes('cloudinary.com'));
        console.log(`Banners: ${banners.length} total, ${bannerCloudinary.length} cloudinary`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

countImages();
