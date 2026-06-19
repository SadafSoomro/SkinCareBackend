import express from 'express';
import {
    getCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign
} from '../Controllers/SaleController.js';
import { protect, admin } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getCampaigns);
router.post('/', protect, admin, createCampaign);
router.put('/:id', protect, admin, updateCampaign);
router.delete('/:id', protect, admin, deleteCampaign);

export default router;
