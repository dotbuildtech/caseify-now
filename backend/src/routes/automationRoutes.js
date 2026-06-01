const express = require('express');
const router = express.Router();
const {
    createCampaign,
    sendWhatsAppNotification,
    getActiveCampaigns
} = require('../controllers/automationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/campaigns/active', getActiveCampaigns);
router.post('/campaigns', protect, admin, createCampaign);
router.post('/whatsapp/notify', protect, admin, sendWhatsAppNotification);

module.exports = router;
