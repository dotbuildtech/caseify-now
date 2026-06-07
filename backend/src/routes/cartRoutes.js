const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    getCart,
    addItemToCart,
    updateCartItemQty,
    removeItemFromCart,
    clearCart,
    getCartItemCount,
    cleanupAbandonedCarts,
    cartSchemas
} = require('../controllers/cartController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const idempotency = require('../middleware/idempotency');

const cartWriteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
});

router.get('/count', protect, getCartItemCount);
router.post('/cleanup', protect, admin, cleanupAbandonedCarts);

router.get('/', protect, getCart);
router.post('/', protect, cartWriteLimiter, idempotency, validate({ body: cartSchemas.addItem }), addItemToCart);
router.put('/:productId', protect, cartWriteLimiter, idempotency, validate({
    params: cartSchemas.productIdParam,
    body: cartSchemas.updateItem
}), updateCartItemQty);
router.delete('/:productId', protect, cartWriteLimiter, validate({ params: cartSchemas.productIdParam }), removeItemFromCart);
router.delete('/', protect, cartWriteLimiter, clearCart);

module.exports = router;
