const Razorpay = require('razorpay');

const isPlaceholder = (val) => !val || /your_|placeholder|changeme|test_secret_xxxxxxxx/i.test(String(val));

const config = {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    currency: 'INR'
};

let razorpayInstance = null;

const isConfigured = () =>
    config.keyId.length > 0 &&
    config.keySecret.length > 0 &&
    !isPlaceholder(config.keyId) &&
    !isPlaceholder(config.keySecret);

const assertConfigured = () => {
    if (!isConfigured()) {
        const err = new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend environment.');
        err.status = 503;
        throw err;
    }
    if (config.keySecret.startsWith('rzp_') || (!config.keyId.startsWith('rzp_test_') && !config.keyId.startsWith('rzp_live_'))) {
        console.warn('[Razorpay Warning] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env appear to be swapped or invalid. Key ID should start with rzp_test_ or rzp_live_.');
    }
    if (process.env.NODE_ENV === 'production' && (!config.webhookSecret || isPlaceholder(config.webhookSecret))) {
        console.warn('[Razorpay Security Warning] RAZORPAY_WEBHOOK_SECRET is missing or using a placeholder in production. Webhooks will be rejected.');
    }
};

const getRazorpayInstance = () => {
    assertConfigured();
    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({
            key_id: config.keyId,
            key_secret: config.keySecret
        });
    }
    return razorpayInstance;
};

module.exports = {
    config,
    isConfigured,
    assertConfigured,
    getRazorpayInstance
};
