import api from './api';

// New flow: no order exists yet — pass the validated cart payload
// (orderItems, shippingAddress, paymentMethod). Or pass { txnid } to re-issue
// a recent payment session.
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
