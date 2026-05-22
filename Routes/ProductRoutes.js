import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from '../Controllers/ProductController.js';
import upload from '../Middleware/Upload.js';

const router = express.Router();

const productUpload = upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'gallery_images', maxCount: 10 }
]);

router.post('/post', productUpload, createProduct);
router.get('/get', getProducts);
router.get('/get/:id', getProductById);
router.put('/update/:id', productUpload, updateProduct);
router.delete('/delete/:id', deleteProduct);

export default router;
