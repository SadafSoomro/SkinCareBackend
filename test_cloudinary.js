import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { connectDB } from './Utils/db.js';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImageFromUrl = async (url, folder) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText} (${response.status})`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

const run = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully.');

    console.log('Testing Cloudinary upload of Unsplash image with User-Agent...');
    const url = 'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=200&h=200&fit=crop';
    const result = await uploadImageFromUrl(url, 'skincare/test');
    console.log('Cloudinary upload successful!');
    console.log('Secure URL:', result);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error in test script:', error.message || error);
    process.exit(1);
  }
};

run();
