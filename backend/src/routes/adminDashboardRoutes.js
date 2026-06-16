const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/adminDashboardController');
const { protect, admin } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const dashboardLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later' }
});

router.get('/', protect, admin, dashboardLimiter, getAdminDashboard);

module.exports = router;
