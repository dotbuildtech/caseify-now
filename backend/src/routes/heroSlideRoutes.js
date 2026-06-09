const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middleware/authMiddleware');
const heroSlideController = require('../controllers/heroSlideController');

const uploadDir = path.join(__dirname, '../../uploads/heroslides');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = `slide-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
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
