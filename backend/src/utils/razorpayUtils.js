const crypto = require('crypto');

/**
 * Constant-time string comparison to prevent timing attacks.
 */
const safeEqual = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Verify Razorpay payment signature from client callback.
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature, secret }) => {
    if (!orderId || !paymentId || !signature || !secret) {
        return false;
    }
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return safeEqual(expectedSignature, signature);
};

/**
 * Verify Razorpay Webhook signature from 'x-razorpay-signature' header.
 * Formula: HMAC_SHA256(raw_request_body, webhook_secret)
 */
const verifyWebhookSignature = ({ rawBody, signature, webhookSecret }) => {
    if (!rawBody || !signature || !webhookSecret) {
        return false;
    }
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    return safeEqual(expectedSignature, signature);
};

/**
 * Sanitize error reasons or gateway text before logging/persisting.
 */
const sanitizeReason = (value) => {
    if (value === undefined || value === null) return null;
    return String(value)
        .replace(/[\u0000-\u001F\u007F\u2028\u2029]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500) || null;
};

module.exports = {
    verifyPaymentSignature,
    verifyWebhookSignature,
    sanitizeReason,
    safeEqual
};
