const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getPublicStorePolicy } = require('../controllers/settingController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin endpoints
router.get('/admin/settings', protect, admin, getSettings);
router.put('/admin/settings', protect, admin, updateSettings);

// Public policy endpoint (for cart & checkout calculation)
router.get('/config/store-policy', getPublicStorePolicy);

module.exports = router;
