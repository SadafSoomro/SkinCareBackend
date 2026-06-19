import SaleCampaign from '../Models/SaleCampaignSchema.js';
import Product from '../Models/ProductSchema.js';

// Get all campaigns
export const getCampaigns = async (req, res) => {
    try {
        const campaigns = await SaleCampaign.find().populate('appliedProducts', 'name brand price');
        res.status(200).json(campaigns);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
    }
};

// Helper function to pick products for percentage target
const determineAppliedProducts = async (targetType, percentageOfProducts, specificProducts) => {
    if (targetType === 'all') {
        return [];
    }
    if (targetType === 'specific') {
        return specificProducts || [];
    }
    if (targetType === 'percentage') {
        const products = await Product.find({ status: 'active' });
        if (products.length === 0) return [];
        
        // Shuffle products to pick randomly
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const count = Math.ceil(products.length * (percentageOfProducts / 100));
        const selected = shuffled.slice(0, count);
        return selected.map(p => p._id);
    }
    return [];
};

// Create a new campaign
export const createCampaign = async (req, res) => {
    try {
        const { name, discountPercentage, startDate, endDate, targetType, percentageOfProducts, specificProducts, isActive } = req.body;

        const appliedProducts = await determineAppliedProducts(targetType, percentageOfProducts, specificProducts);

        const campaign = new SaleCampaign({
            name,
            discountPercentage,
            startDate,
            endDate,
            targetType,
            percentageOfProducts,
            appliedProducts,
            isActive: isActive !== undefined ? isActive : true
        });

        await campaign.save();
        res.status(201).json(campaign);
    } catch (error) {
        res.status(500).json({ message: 'Error creating campaign', error: error.message });
    }
};

// Update a campaign
export const updateCampaign = async (req, res) => {
    try {
        const { name, discountPercentage, startDate, endDate, targetType, percentageOfProducts, specificProducts, isActive } = req.body;

        const existing = await SaleCampaign.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        let appliedProducts = existing.appliedProducts;
        
        // Recalculate products if type or percentage changes
        if (
            targetType !== undefined && (
                targetType !== existing.targetType || 
                percentageOfProducts !== existing.percentageOfProducts ||
                JSON.stringify(specificProducts) !== JSON.stringify(existing.appliedProducts)
            )
        ) {
            appliedProducts = await determineAppliedProducts(
                targetType, 
                percentageOfProducts !== undefined ? percentageOfProducts : existing.percentageOfProducts, 
                specificProducts
            );
        }

        const updatedCampaign = await SaleCampaign.findByIdAndUpdate(
            req.params.id,
            {
                name: name !== undefined ? name : existing.name,
                discountPercentage: discountPercentage !== undefined ? discountPercentage : existing.discountPercentage,
                startDate: startDate !== undefined ? startDate : existing.startDate,
                endDate: endDate !== undefined ? endDate : existing.endDate,
                targetType: targetType !== undefined ? targetType : existing.targetType,
                percentageOfProducts: percentageOfProducts !== undefined ? percentageOfProducts : existing.percentageOfProducts,
                appliedProducts,
                isActive: isActive !== undefined ? isActive : existing.isActive
            },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedCampaign);
    } catch (error) {
        res.status(500).json({ message: 'Error updating campaign', error: error.message });
    }
};

// Delete a campaign
export const deleteCampaign = async (req, res) => {
    try {
        const campaign = await SaleCampaign.findByIdAndDelete(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        res.status(200).json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting campaign', error: error.message });
    }
};
