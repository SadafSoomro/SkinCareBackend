import Product from '../Models/ProductSchema.js';

// Create a new product
export const createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // Normalize array fields from FormData
        if (productData.skin_type && typeof productData.skin_type === 'string') {
            productData.skin_type = productData.skin_type.split(',').map(s => s.trim()).filter(s => s !== '');
        }
        if (productData.concerns && typeof productData.concerns === 'string') {
            productData.concerns = productData.concerns.split(',').map(s => s.trim()).filter(s => s !== '');
        }

        // Handle main image
        if (req.files && req.files.main_image) {
            productData.main_image = req.files.main_image[0].path;
        }

        // Handle gallery images
        if (req.files && req.files.gallery_images) {
            productData.gallery_images = req.files.gallery_images.map(file => file.path);
        }

        const product = new Product(productData);
        await product.save();
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

// Get all products
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category_id', 'name');
        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// Get single product by ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category_id', 'name');
        if (!product) {

            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Normalize array fields from FormData
        if (updateData.skin_type && typeof updateData.skin_type === 'string') {
            updateData.skin_type = updateData.skin_type.split(',').map(s => s.trim()).filter(s => s !== '');
        }
        if (updateData.concerns && typeof updateData.concerns === 'string') {
            updateData.concerns = updateData.concerns.split(',').map(s => s.trim()).filter(s => s !== '');
        }

        // Handle main image update
        if (req.files && req.files.main_image) {
            updateData.main_image = req.files.main_image[0].path;
        }

        // Handle gallery images update
        if (req.files && req.files.gallery_images) {
            const newGalleryImages = req.files.gallery_images.map(file => file.path);
            // If user wants to append or replace, that depends on frontend logic. 
            // For now, we'll replace the gallery if new images are provided.
            updateData.gallery_images = newGalleryImages;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};
