import express from 'express';
import { 
  createBanner, 
  getBanners, 
  getBannerById, 
  updateBanner, 
  deleteBanner 
} from '../Controllers/BannerController.js';
import upload from '../Middleware/Upload.js';

const router = express.Router();

router.post('/post', upload.single('image'), createBanner);
router.get('/get', getBanners);
router.get('/get/:id', getBannerById);
router.put('/update/:id', upload.single('image'), updateBanner);
router.delete('/delete/:id', deleteBanner);

export default router;
