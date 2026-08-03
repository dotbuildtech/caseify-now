const express = require('express');
const router = express.Router();
const {
    payuInitiate,
    payuSuccess,
    payuFailure
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { paymentInitiateLimiter, paymentCallbackLimiter } = require('../middleware/rateLimiter');

router.post('/payu/initiate', protect, paymentInitiateLimiter, payuInitiate);

// Callbacks are intentionally session-less: a valid response hash is proof of
// authenticity, and the order is resolved from the txnid server-side. A lost
// or expired session must not block verification of a real payment.
// originCheck (global) still rejects cross-site POSTs.
router.post('/payu/success', paymentCallbackLimiter, payuSuccess);
router.post('/payu/failure', paymentCallbackLimiter, payuFailure);

module.exports = router;
