const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadFromBuffer } = require('../services/cloudinaryService');
const { saveDataUrl } = require('../utils/saveDataUrl');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');

const studioUploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many image uploads, please slow down' }
});

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

router.post('/studio-image', protect, studioUploadLimiter, validate({
    body: z.object({ dataUrl: z.string() })
}), asyncHandler(async (req, res) => {
    const url = await saveDataUrl(req.body.dataUrl);
    if (!url || url === req.body.dataUrl) {
        res.status(400);
        throw new Error('Image upload failed');
    }
    res.json({ url });
}));

const studioBlobLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many image uploads, please slow down' }
});

const blobUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only jpg, jpeg, png, webp allowed'));
    }
});

router.post('/studio-image-blob', protect, studioBlobLimiter, blobUpload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400); throw new Error('No file provided'); }
    const result = await uploadFromBuffer(req.file.buffer, 'phone-cover-platform/studio');
    res.json({ url: result.secure_url });
}));

module.exports = router;
