const asyncHandler = require('../utils/asyncHandler');
const {
    initiateRazorpayOrder,
    verifyRazorpayPayment,
    processRazorpayWebhook
} = require('../services/razorpayService');
const {
    initiatePayuPayment,
    initiateForExistingOrder,
    processPayuCallback
} = require('../services/payuService');

/**
 * @desc    Create Razorpay Order (Amount calculated server-side)
 * @route   POST /api/payments/razorpay/create-order (or /api/payments/razorpay/initiate)
 * @access  Private
 */
exports.razorpayCreateOrder = asyncHandler(async (req, res) => {
    const body = req.body || {};
    const { orderItems, shippingAddress, paymentMethod } = body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        res.status(400);
        throw new Error('Order items are required');
    }

    const orderData = await initiateRazorpayOrder({
        userId: req.user.id,
        orderItems,
        shippingAddress,
        paymentMethod: paymentMethod || 'Razorpay',
        requestId: req.id
    });

    res.json({
        success: true,
        order: orderData
    });
});

/**
 * @desc    Verify Razorpay Payment Signature and finalize order
 * @route   POST /api/payments/razorpay/verify
 * @access  Private / Authenticated
 */
exports.razorpayVerify = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400);
        throw new Error('Missing payment verification details');
    }

    const outcome = await verifyRazorpayPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        user: req.user,
        requestId: req.id
    });

    res.json({
        success: true,
        ...outcome
    });
});

/**
 * @desc    Razorpay Webhook endpoint for server-to-server status updates
 * @route   POST /api/payments/razorpay/webhook
 * @access  Public (HMAC signature-verified)
 */
exports.razorpayWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

    const result = await processRazorpayWebhook({
        rawBody,
        signature,
        eventData: req.body,
        requestId: req.id
    });

    res.status(200).json({ status: 'ok', ...result });
});

// -------------------------------------------------------------
// Legacy PayU endpoints preserved for backwards compatibility
// -------------------------------------------------------------
const GATEWAY_FIELDS = [
    'hash', 'key', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 'phone',
    'surl', 'furl', 'udf1', 'udf2', 'udf3', 'udf4', 'udf5', 'udf6', 'udf7', 'udf8', 'udf9', 'udf10',
    'status', 'mihpayid', 'mode', 'error', 'error_message', 'bank_ref_num', 'payuMoneyId',
    'unmappedstatus', 'net_amount_debit'
];

const cleanGatewayResponse = (body) => {
    const out = {};
    for (const key of GATEWAY_FIELDS) {
        if (body[key] !== undefined && body[key] !== null) {
            out[key] = String(body[key]);
        }
    }
    return out;
};

exports.payuInitiate = asyncHandler(async (req, res) => {
    const body = req.body || {};
    const hasPayload = Array.isArray(body.orderItems) && body.orderItems.length > 0;

    let payment;
    if (hasPayload) {
        payment = await initiatePayuPayment({
            userId: req.user.id,
            orderItems: body.orderItems,
            shippingAddress: body.shippingAddress,
            paymentMethod: body.paymentMethod,
            requestId: req.id
        });
    } else {
        res.status(400);
        throw new Error('Provide orderItems to initiate payment');
    }

    res.json({ success: true, payment });
});

exports.payuSuccess = asyncHandler(async (req, res) => {
    const response = cleanGatewayResponse(req.body?.payuParams || req.body || {});
    const outcome = await processPayuCallback({ response, user: req.user, requestId: req.id });
    if (!outcome.valid || (!outcome.success && !outcome.alreadyPaid)) {
        res.status(400);
        throw new Error(outcome.reason || 'Payment was not successful');
    }
    res.json({
        success: true,
        alreadyPaid: outcome.alreadyPaid,
        orderId: outcome.order?.id || null,
        transactionId: response.txnid,
        amount: Number(outcome.order?.totalPrice || 0)
    });
});

exports.payuFailure = asyncHandler(async (req, res) => {
    const response = cleanGatewayResponse(req.body?.payuParams || req.body || {});
    const outcome = await processPayuCallback({ response, user: req.user, requestId: req.id });
    if (outcome.alreadyPaid || outcome.success) {
        return res.json({
            success: true,
            alreadyPaid: outcome.alreadyPaid,
            orderId: outcome.order?.id || null,
            transactionId: response.txnid,
            amount: Number(outcome.order?.totalPrice || 0)
        });
    }
    res.json({
        success: false,
        transactionId: response.txnid,
        reason: response.error_message || response.error || 'Payment failed'
    });
});
