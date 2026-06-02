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

const axios = require('axios');
const aisensy = require('../config/aisensy');

// @desc    WhatsApp notification via Aisensy
// @route   POST /api/automation/whatsapp/notify
// @access  Private/Admin
exports.sendWhatsAppNotification = async (req, res) => {
    const { phoneNumber, message, templateName, userName } = req.body;
    try {
        const url = `https://backend.aisensy.com/campaign/external/v1/projects/${aisensy.projectId}/template`;
        
        const response = await axios.post(url, {
            apiKey: aisensy.apiKey,
            campaignName: templateName || 'common_notification',
            destination: phoneNumber,
            userName: userName || 'Customer',
            templateParams: [message],
            source: 'API'
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Aisensy Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response ? error.response.data.message : error.message 
        });
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
