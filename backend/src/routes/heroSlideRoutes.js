const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');
const heroSlideController = require('../controllers/heroSlideController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only jpg, jpeg, png, webp allowed'));
    }
});

const uploadMiddleware = (req, res, next) => {
    upload.single('bg')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message });
        }
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
};

router.get('/', heroSlideController.listSlides);
router.get('/:id', heroSlideController.getSlide);

router.post('/', protect, admin, uploadMiddleware, heroSlideController.createSlide);
router.put('/reorder', protect, admin, heroSlideController.reorderSlides);
router.put('/:id', protect, admin, uploadMiddleware, heroSlideController.updateSlide);
router.delete('/:id', protect, admin, heroSlideController.deleteSlide);

module.exports = router;
