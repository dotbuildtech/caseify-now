const Campaign = require('../models/Campaign');
const { Order } = require('../models/Order');
const { Op } = require('sequelize');

// @desc    Create a marketing campaign
// @route   POST /api/automation/campaigns
// @access  Private/Admin
exports.createCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.create(req.body);
        res.status(201).json(campaign);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    WhatsApp notification mock
// @route   POST /api/automation/whatsapp/notify
// @access  Private/Admin
exports.sendWhatsAppNotification = async (req, res) => {
    const { phoneNumber, message } = req.body;
    try {
        // Mocking WhatsApp API call
        console.log(`WhatsApp message sent to ${phoneNumber}: ${message}`);
        res.json({ success: true, message: 'WhatsApp notification sent (mocked)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all active campaigns
// @route   GET /api/automation/campaigns/active
// @access  Public
exports.getActiveCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.findAll({
            where: {
                isActive: true,
                endDate: { [Op.gt]: new Date() }
            }
        });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
