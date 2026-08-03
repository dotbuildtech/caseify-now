const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    getMyOrders,
    getOrders,
    updateOrderStatus
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

const orderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many order requests, please try again later' }
});

router.post('/', protect, orderLimiter, addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
// Marking an order paid (COD on delivery) is an admin action
router.put('/:id/pay', protect, admin, updateOrderToPaid);

// Admin routes
router.get('/', protect, admin, getOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
