const express = require('express');
const router = express.Router();
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
    removeProductImage,
    getLowStockProducts,
    searchProducts,
    productSchemas
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const publicReadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
});

const adminWriteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
});

router.get('/search', publicReadLimiter, validate({ query: productSchemas.search }), searchProducts);
router.get('/low-stock', protect, admin, getLowStockProducts);
router.get('/', publicReadLimiter, validate({ query: productSchemas.list }), getProducts);
router.get('/:id', publicReadLimiter, getProductById);

router.post('/', protect, admin, adminWriteLimiter, validate({ body: productSchemas.create }), createProduct);
router.post('/bulk', protect, admin, adminWriteLimiter, bulkCreateProducts);
router.put('/bulk', protect, admin, adminWriteLimiter, validate({ body: productSchemas.bulkUpdate }), bulkUpdateProducts);
router.delete('/bulk', protect, admin, adminWriteLimiter, bulkDeleteProducts);

router.put('/:id', protect, admin, adminWriteLimiter, validate({ body: productSchemas.update }), updateProduct);
router.delete('/:id', protect, admin, adminWriteLimiter, deleteProduct);

router.post('/:id/images', protect, admin, adminWriteLimiter, addProductImage);
router.delete('/:id/images', protect, admin, adminWriteLimiter, removeProductImage);

module.exports = router;
