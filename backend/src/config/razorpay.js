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
