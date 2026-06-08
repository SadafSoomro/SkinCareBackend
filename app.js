import express from 'express';
import cors from 'cors';
import { connectDB } from './Utils/db.js';
import categoryRouter from './Routes/CategoryRouter.js';
import bannerRouter from './Routes/BannerRoutes.js';
import productRouter from './Routes/ProductRoutes.js';
import authRouter from './Routes/AuthRoutes.js';
import couponRouter from './Routes/CouponRoutes.js';
import orderRouter from './Routes/OrderRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const skipDbPaths = new Set(['/', '/health', '/favicon.ico', '/favicon.png']);

app.use(async (req, res, next) => {
    if (skipDbPaths.has(req.path)) {
        return next();
    }

    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection error:', error.message);
        const isWhitelist = /whitelist|IP that isn't/i.test(error.message);
        res.status(500).json({
            message: 'Database connection failed',
            error: error.message,
            hint: isWhitelist
                ? 'MongoDB Atlas → Network Access → Add IP → Allow access from anywhere (0.0.0.0/0). Vercel uses dynamic IPs; your PC IP alone is not enough.'
                : undefined,
        });
    }
});

// Routes
app.use('/categories', categoryRouter);
app.use('/banners', bannerRouter);
app.use('/products', productRouter);
app.use('/auth', authRouter);
app.use('/coupons', couponRouter);
app.use('/orders', orderRouter);





app.get('/', (req, res) => {
    res.status(200).json({ message: 'SkinCare API is running' });
});

app.get('/health', async (req, res) => {
    try {
        await connectDB();
        res.status(200).json({ ok: true, database: 'connected' });
    } catch (error) {
        res.status(500).json({
            ok: false,
            database: 'failed',
            error: error.message,
            mongoUriSet: Boolean(process.env.MONGO_URI),
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

export default app;