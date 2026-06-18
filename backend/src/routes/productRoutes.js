const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkCreateProducts,
    bulkUpdateProducts,
    bulkDeleteProducts,
    addProductImage,
    uploadProductImage,
    removeProductImage,
    getLowStockProducts,
    searchProducts,
    productSchemas
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
const validate = require('../middleware/validate');

const productImageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only jpg, jpeg, png, webp allowed'));
    }
});

const rateLimitOpts = { standardHeaders: true, legacyHeaders: false, validate: { xForwardedForHeader: false } };

const publicReadLimiter = rateLimit({
    ...rateLimitOpts,
    windowMs: 60 * 1000,
    max: 120
});

const adminWriteLimiter = rateLimit({
    ...rateLimitOpts,
    windowMs: 60 * 1000,
    max: 60
});

router.get('/search', optionalAuth, publicReadLimiter, validate({ query: productSchemas.search }), searchProducts);
router.get('/low-stock', protect, admin, getLowStockProducts);
router.get('/', optionalAuth, publicReadLimiter, validate({ query: productSchemas.list }), getProducts);
router.get('/:id', optionalAuth, publicReadLimiter, getProductById);

router.post('/', protect, admin, adminWriteLimiter, validate({ body: productSchemas.create }), createProduct);
router.post('/bulk', protect, admin, adminWriteLimiter, bulkCreateProducts);
router.put('/bulk', protect, admin, adminWriteLimiter, validate({ body: productSchemas.bulkUpdate }), bulkUpdateProducts);
router.delete('/bulk', protect, admin, adminWriteLimiter, bulkDeleteProducts);

router.put('/:id', protect, admin, adminWriteLimiter, validate({ body: productSchemas.update }), updateProduct);
router.delete('/:id', protect, admin, adminWriteLimiter, deleteProduct);

router.post('/:id/images', protect, admin, adminWriteLimiter, addProductImage);
router.post('/:id/upload-image', protect, admin, adminWriteLimiter, productImageUpload.single('image'), uploadProductImage);
router.delete('/:id/images', protect, admin, adminWriteLimiter, removeProductImage);

module.exports = router;
