const express = require('express');
const router = express.Router();
const {
    generateInvoice,
    getFinancialAnalytics
} = require('../controllers/accountingController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/invoice/:orderId', protect, admin, generateInvoice);
router.get('/analytics', protect, admin, getFinancialAnalytics);

module.exports = router;
