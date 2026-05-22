import Banner from '../Models/BannerSchema.js';

// Create a new banner
export const createBanner = async (req, res) => {
  try {
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);
    const { title, description } = req.body;
    const image = req.file ? req.file.path : '';

    if (!image) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    const banner = new Banner({
      title,
      description,
      image
    });

    await banner.save();
    res.status(201).json({ message: 'Banner created successfully', banner });
  } catch (error) {
    res.status(500).json({ message: 'Error creating banner', error: error.message });
  }
};

// Get all banners
export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching banners', error: error.message });
  }
};

// Get single banner by ID
export const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching banner', error: error.message });
  }
};

// Update banner
export const updateBanner = async (req, res) => {
  try {
    const { title, description } = req.body;
    let image = req.body.image;

    if (req.file) {
      image = req.file.path;
    }

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { title, description, image },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    res.status(200).json({ message: 'Banner updated successfully', banner });
  } catch (error) {
    res.status(500).json({ message: 'Error updating banner', error: error.message });
  }
};

// Delete banner
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting banner', error: error.message });
  }
};
