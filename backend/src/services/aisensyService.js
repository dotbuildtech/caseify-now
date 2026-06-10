const axios = require('axios');
const { apiKey } = require('../config/aisensy');

const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';

const isDevMode = process.env.NODE_ENV !== 'production';

const sendCampaign = async (campaignName, phone, templateParams = []) => {
    if (!apiKey) {
        if (isDevMode) {
            console.log(`[aisensy:dev] campaign=${campaignName} phone=${phone} params=${JSON.stringify(templateParams)}`);
            return { skipped: true, reason: 'no-api-key' };
        }
        throw new Error('Aisensy is not configured');
    }

    try {
        const response = await axios.post(
            AISENSY_API_URL,
            {
                apiKey,
                campaignName,
                destination: phone,
                userName: 'Caseify Now',
                templateParams,
                source: 'API',
                media: {},
                buttons: [],
                carouselCards: [],
                location: {}
            },
            { timeout: 10000 }
        );
        return response.data;
    } catch (error) {
        console.error(`[aisensy] send failed campaign=${campaignName} phone=${phone}: ${error.message}`);
        throw new Error('Failed to send message');
    }
};

exports.sendOtp = async (phone, code, expiryMinutes) => {
    return sendCampaign(process.env.AISENSY_OTP_CAMPAIGN || 'otp_verification', phone, [
        code,
        String(expiryMinutes)
    ]);
};

exports.sendPasswordReset = async (phone, link, expiryMinutes) => {
    return sendCampaign(process.env.AISENSY_RESET_CAMPAIGN || 'password_reset', phone, [
        link,
        String(expiryMinutes)
    ]);
};

exports.sendWelcome = async (phone, name) => {
    return sendCampaign(process.env.AISENSY_WELCOME_CAMPAIGN || 'welcome', phone, [name]);
};
