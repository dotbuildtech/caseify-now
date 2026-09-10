import api from './api';

/**
 * Creates a Razorpay Order on the backend (amounts calculated server-side).
 * @param {Object} payload { orderItems, shippingAddress, paymentMethod }
 */
export const createRazorpayOrder = async (payload) => {
    const r = await api.post('/payments/razorpay/create-order', payload);
    return r?.data?.order;
};

/**
 * Verifies Razorpay payment signature with HMAC SHA256 on the backend.
 * @param {Object} verificationData { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyRazorpayPayment = async (verificationData) => {
    const r = await api.post('/payments/razorpay/verify', verificationData);
    return r?.data;
};

// -------------------------------------------------------------
// Legacy PayU API helpers preserved for backwards compatibility
// -------------------------------------------------------------
export const initiatePayuPayment = async (payload) => {
    const r = await api.post('/payments/payu/initiate', payload);
    return r?.data?.payment;
};

export const verifyPayuSuccess = async (payuParams) => {
    const r = await api.post('/payments/payu/success', { payuParams });
    return r?.data;
};

export const verifyPayuFailure = async (payuParams) => {
    const r = await api.post('/payments/payu/failure', { payuParams });
    return r?.data;
};
