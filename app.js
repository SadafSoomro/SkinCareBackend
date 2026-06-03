import express from 'express';
import cors from 'cors';
import { connectDB } from './Utils/db.js';
import categoryRouter from './Routes/CategoryRouter.js';
import bannerRouter from './Routes/BannerRoutes.js';
import productRouter from './Routes/ProductRoutes.js';
import authRouter from './Routes/AuthRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use(async (req, res, next) => {
    if (req.path === '/') {
        return next();
    }

    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection error:', error.message);
        res.status(500).json({
            message: 'Database connection failed',
            error: error.message,
        });
    }
});

// Routes
app.use('/categories', categoryRouter);
app.use('/banners', bannerRouter);
app.use('/products', productRouter);
app.use('/auth', authRouter);





// Basic Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'SkinCare API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

export default app;