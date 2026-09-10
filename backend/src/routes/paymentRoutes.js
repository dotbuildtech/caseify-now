const express = require('express');
const router = express.Router();
const {
    razorpayCreateOrder,
    razorpayVerify,
    razorpayWebhook,
    payuInitiate,
    payuSuccess,
    payuFailure
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { paymentInitiateLimiter, paymentCallbackLimiter } = require('../middleware/rateLimiter');

// Razorpay Payment Endpoints
router.post('/razorpay/create-order', protect, paymentInitiateLimiter, razorpayCreateOrder);
router.post('/razorpay/initiate', protect, paymentInitiateLimiter, razorpayCreateOrder);
router.post('/razorpay/verify', protect, paymentCallbackLimiter, razorpayVerify);
router.post('/razorpay/webhook', paymentCallbackLimiter, razorpayWebhook);

// Legacy PayU Endpoints
router.post('/payu/initiate', protect, paymentInitiateLimiter, payuInitiate);
router.post('/payu/success', paymentCallbackLimiter, payuSuccess);
router.post('/payu/failure', paymentCallbackLimiter, payuFailure);

module.exports = router;
