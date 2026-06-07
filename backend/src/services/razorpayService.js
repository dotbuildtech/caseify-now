const crypto = require('crypto');
const razorpay = require('../config/razorpay');

const isPlaceholder = (val) => !val || val.includes('your_') || val.includes('placeholder');

const createRazorpayOrder = async ({ amount, currency = 'INR', receipt }) => {
    if (isPlaceholder(process.env.RAZORPAY_KEY_ID) || isPlaceholder(process.env.RAZORPAY_KEY_SECRET)) {
        const err = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
        err.status = 503;
        throw err;
    }
    return await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt,
        payment_capture: 1
    });
};

const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    if (isPlaceholder(process.env.RAZORPAY_KEY_SECRET)) {
        const err = new Error('Razorpay is not configured');
        err.status = 503;
        throw err;
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return false;
    }
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(String(razorpaySignature), 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};

module.exports = { createRazorpayOrder, verifyPaymentSignature };
