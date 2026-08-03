const asyncHandler = require('../utils/asyncHandler');
const { initiatePayuPayment, initiateForExistingOrder, processPayuCallback } = require('../services/payuService');

const GATEWAY_FIELDS = [
    'hash', 'key', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 'phone',
    'surl', 'furl', 'udf1', 'udf2', 'udf3', 'udf4', 'udf5', 'udf6', 'udf7', 'udf8', 'udf9', 'udf10',
    'status', 'mihpayid', 'mode', 'error', 'error_message', 'bank_ref_num', 'payuMoneyId',
    'unmappedstatus', 'net_amount_debit'
];

// Whitelist gateway response fields; never trust unlisted payload keys
const cleanGatewayResponse = (body) => {
    const out = {};
    for (const key of GATEWAY_FIELDS) {
        if (body[key] !== undefined && body[key] !== null) {
            out[key] = String(body[key]);
        }
    }
    return out;
};

const parsePositiveInt = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const id = parseInt(value, 10);
    if (!Number.isInteger(id) || id <= 0) {
        const err = new Error('Valid orderId is required');
        err.status = 400;
        throw err;
    }
    return id;
};

// @desc    Initiate a PayU payment
// @route   POST /api/payments/payu/initiate
// @access  Private
// New flow: body carries the validated cart payload (orderItems, shippingAddress,
// paymentMethod) — no order row is created yet. Alternatively body.txnid re-issues
// a recent initiated session, and body.orderId pays a legacy order row.
exports.payuInitiate = asyncHandler(async (req, res) => {
    const body = req.body || {};
    const orderId = parsePositiveInt(body.orderId);
    const txnid = typeof body.txnid === 'string' && body.txnid.trim() ? body.txnid.trim() : null;
    const hasPayload = Array.isArray(body.orderItems) && body.orderItems.length > 0;

    let payment;
    if (txnid) {
        payment = await initiatePayuPayment({
            userId: req.user.id,
            txnid,
            orderItems: [],
            shippingAddress: {},
            paymentMethod: 'online',
            requestId: req.id
        });
    } else if (hasPayload) {
        payment = await initiatePayuPayment({
            userId: req.user.id,
            orderItems: body.orderItems,
            shippingAddress: body.shippingAddress,
            paymentMethod: body.paymentMethod,
            requestId: req.id
        });
    } else if (orderId) {
        payment = await initiateForExistingOrder({ orderId, user: req.user, requestId: req.id });
    } else {
        res.status(400);
        throw new Error('Provide orderItems, a txnid to reuse, or an orderId');
    }

    res.json({ success: true, payment });
});

// @desc    PayU success callback (browser redirect) — verify hash, place the order
// @route   POST /api/payments/payu/success
// @access  Public (hash-verified; session resolved from txnid, session optional)
exports.payuSuccess = asyncHandler(async (req, res) => {
    const response = cleanGatewayResponse(req.body?.payuParams || req.body || {});

    const outcome = await processPayuCallback({ response, user: req.user, requestId: req.id });
    if (!outcome.valid) {
        res.status(400);
        throw new Error(outcome.reason || 'Payment verification failed');
    }
    if (!outcome.success && !outcome.alreadyPaid) {
        res.status(400);
        throw new Error(outcome.reason || 'Payment was not successful');
    }

    res.json({
        success: true,
        alreadyPaid: outcome.alreadyPaid,
        orderId: outcome.order?.id || null,
        transactionId: response.txnid,
        mihpayid: response.mihpayid || null,
        amount: Number(outcome.order?.totalPrice || 0)
    });
});

// @desc    PayU failure callback (browser redirect) — verify hash, release reservation
// @route   POST /api/payments/payu/failure
// @access  Public (hash-verified; session resolved from txnid, session optional)
exports.payuFailure = asyncHandler(async (req, res) => {
    const response = cleanGatewayResponse(req.body?.payuParams || req.body || {});

    const outcome = await processPayuCallback({ response, user: req.user, requestId: req.id });
    if (!outcome.valid) {
        res.status(400);
        throw new Error(outcome.reason || 'Payment verification failed');
    }
    if (outcome.alreadyPaid || outcome.success) {
        // User actually paid but landed on the failure page (e.g. browser killed the redirect)
        return res.json({
            success: true,
            alreadyPaid: outcome.alreadyPaid,
            orderId: outcome.order?.id || null,
            transactionId: response.txnid,
            mihpayid: response.mihpayid || null,
            amount: Number(outcome.order?.totalPrice || 0)
        });
    }

    res.json({
        success: false,
        transactionId: response.txnid,
        reason: sanitizeReason(response.error_message || response.error) || 'Payment failed or was cancelled'
    });
});

const sanitizeReason = (value) => {
    if (value === undefined || value === null) return null;
    return String(value)
        .replace(/[\u0000-\u001F\u007F\u2028\u2029]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500) || null;
};
