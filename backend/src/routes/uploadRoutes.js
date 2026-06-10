const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadFromBuffer } = require('../services/cloudinaryService');
const asyncHandler = require('../utils/asyncHandler');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only jpg, jpeg, png, webp allowed'));
    }
});

router.post('/image', protect, admin, upload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No file provided'); }
    const result = await uploadFromBuffer(req.file.buffer, 'phone-cover-platform/products');
    res.json({ url: result.secure_url, publicId: result.public_id });
}));

module.exports = router;
