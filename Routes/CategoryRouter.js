import express from 'express';
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../Controllers/CategoryContoller.js';

import upload from '../Middleware/Upload.js';

const router = express.Router();

router.post('/create', upload.single('image'), createCategory);
router.get('/get', getCategories);
router.get('/get/:id', getCategoryById);
router.put('/update/:id', upload.single('image'), updateCategory);
router.delete('/delete/:id', deleteCategory);

export default router;
