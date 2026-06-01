const express = require('express');
const router = express.Router();
const {
    getSalesAnalytics,
    getCustomerAnalytics
} = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/sales', protect, admin, getSalesAnalytics);
router.get('/customers', protect, admin, getCustomerAnalytics);

module.exports = router;
