const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { Order } = require('../models/Order');
const User = require('../models/User');
const PaymentRecord = require('../models/PaymentRecord');
const Invoice = require('../models/Invoice');
const { config, assertConfigured } = require('../config/payu');
const { generatePaymentHash, verifyResponseHash } = require('../utils/payuHash');
const { logSecurityEvent } = require('../utils/securityLog');
const {
    buildOrderPayload,
    reserveStock,
    releaseReservedStock,
    materializeOrder
} = require('./orderService');

const MAX_TXNID_LENGTH = 30;
const MAX_PAYMENT_ATTEMPTS_PER_USER = 10;
const RECENT_INITIATED_MS = 30 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;

const generateTxnId = () => {
    const txnid = `PC${Date.now()}${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    return txnid.slice(0, MAX_TXNID_LENGTH);
};

// Gateway-provided error text is attacker-influenceable (it is not covered by
// the response hash), so strip control characters before storing/logging.
const sanitizeReason = (value) => {
    if (value === undefined || value === null) return null;
    const cleaned = String(value)
        .replace(/[\u0000-\u001F\u007F\u2028\u2029]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned.slice(0, 500) || null;
};

const toAmountString = (n) => (Number(n) || 0).toFixed(2);

const amountsMatch = (a, b) => {
    const na = Math.round((Number(a) || 0) * 100);
    const nb = Math.round((Number(b) || 0) * 100);
    return na === nb;
};

const buildProductInfo = (payload) => {
    const names = (payload.items || []).map((it) =>
        it.type === 'custom'
            ? `${it.designMeta?.materialLabel || 'Custom'} Phone Case`
            : (it.snapshot?.productName || 'Product'));
    let info = names.slice(0, 2).join(', ');
    if (names.length > 2) info += ` +${names.length - 2} more`;
    return info.slice(0, 100) || 'Online Order';
};

const buildHashAndParams = ({ txnid, amount, payload, firstname, email, phone }) => {
    const productinfo = buildProductInfo(payload);
    const hash = generatePaymentHash({
        key: config.key,
        txnid,
        amount: toAmountString(amount),
        productinfo,
        firstname,
        email,
        salt: config.salt
    });
    return {
        key: config.key,
        txnid,
        amount: toAmountString(amount),
        productinfo,
        firstname,
        email,
        phone,
        surl: config.successUrl,
        furl: config.failureUrl,
        hash,
        payuUrl: config.payuUrl,
        mode: config.mode,
        totals: {
            itemsPrice: payload.itemsPrice,
            taxPrice: payload.taxPrice,
            shippingPrice: payload.shippingPrice,
            totalPrice: payload.totalPrice
        }
    };
};

// NEW FLOW: no order exists yet. The validated cart payload is stored on the
// PaymentRecord and stock is reserved; the Order is created only when the
// gateway confirms the payment (success callback).
const initiatePayuPayment = async ({ userId, orderItems, shippingAddress, paymentMethod, txnid: reuseTxnid, requestId }) => {
    assertConfigured();

    // A pending payment may still settle at the gateway later; re-initiating
    // risks a double charge, so block new sessions while one is pending.
    const pendingRecord = await PaymentRecord.findOne({
        where: { UserId: userId, status: 'Pending' }
    });
    if (pendingRecord) {
        const err = new Error('A previous payment for this order is still being processed. Please check the payment status before retrying.');
        err.status = 400;
        throw err;
    }

    const attemptsInWindow = await PaymentRecord.count({
        where: { UserId: userId, createdAt: { [Op.gte]: new Date(Date.now() - ATTEMPT_WINDOW_MS) } }
    });
    if (attemptsInWindow >= MAX_PAYMENT_ATTEMPTS_PER_USER) {
        const err = new Error('Too many payment attempts, please contact support');
        err.status = 429;
        throw err;
    }

    let payload = null;
    let record = null;
    let txnid = null;

    if (reuseTxnid) {
        record = await PaymentRecord.findOne({
            where: {
                transactionId: reuseTxnid,
                UserId: userId,
                status: 'Initiated',
                createdAt: { [Op.gte]: new Date(Date.now() - RECENT_INITIATED_MS) }
            }
        });
        if (!record) {
            const err = new Error('Payment session expired; please try again from checkout');
            err.status = 404;
            throw err;
        }
        txnid = record.transactionId;
        payload = record.payload;
    } else {
        payload = await buildOrderPayload({ orderItems, shippingAddress, paymentMethod });

        const normalizedMethod = String(payload.paymentMethod).toLowerCase();
        if (normalizedMethod === 'cod') {
            const err = new Error('Cash on Delivery orders do not require online payment');
            err.status = 400;
            throw err;
        }
        const amount = Number(payload.totalPrice);
        if (!Number.isFinite(amount) || amount <= 0) {
            const err = new Error('Invalid order amount');
            err.status = 400;
            throw err;
        }

        // Reuse a recent unresolved initiate so a payment made against it is
        // never orphaned by a new txnid (double-click or retry).
        const recentInitiated = await PaymentRecord.findOne({
            where: {
                UserId: userId,
                OrderId: null,
                status: 'Initiated',
                createdAt: { [Op.gte]: new Date(Date.now() - RECENT_INITIATED_MS) }
            },
            order: [['createdAt', 'DESC']]
        });
        if (recentInitiated) {
            if (recentInitiated.payload?.fingerprint === payload.fingerprint) {
                record = recentInitiated;
                txnid = recentInitiated.transactionId;
            } else {
                // Cart changed since an abandoned session — release its stock
                // reservation and start a fresh session.
                await sequelize.transaction(async (t) => {
                    const fresh = await PaymentRecord.findByPk(recentInitiated.id, { transaction: t, lock: t.LOCK.UPDATE });
                    if (fresh && fresh.status === 'Initiated') {
                        await releaseReservedStock(fresh.payload?.items || [], t);
                        fresh.status = 'Expired';
                        fresh.payload = null;
                        await fresh.save({ transaction: t });
                    }
                });
            }
        }
        if (!txnid) txnid = generateTxnId();

        if (!record) {
            await sequelize.transaction(async (t) => {
                await reserveStock(payload.items, t);
                await PaymentRecord.create({
                    transactionId: txnid,
                    gateway: 'PayU',
                    gatewayTransactionId: txnid,
                    amount,
                    currency: 'INR',
                    netAmount: amount,
                    status: 'Initiated',
                    paymentMethod: payload.paymentMethod,
                    OrderId: null,
                    UserId: userId,
                    payload,
                    paidAt: new Date(),
                    notes: 'PayU payment initiated; order materializes after success'
                }, { transaction: t });
            });
        }
    }

    const amount = Number(payload.totalPrice);
    const customer = await User.findByPk(userId, { attributes: ['name', 'email', 'phone'] });
    const shipping = payload.shippingAddress || {};
    const fullName = String(shipping.fullName || customer?.name || '').trim();
    const firstname = fullName.split(/\s+/)[0] || 'Customer';
    const email = String(shipping.email || customer?.email || '').trim();
    const phone = String(shipping.phone || customer?.phone || '').trim();
    if (!email) {
        const err = new Error('Customer email is required for online payment');
        err.status = 400;
        throw err;
    }

    const params = buildHashAndParams({ txnid, amount, payload, firstname, email, phone });

    logSecurityEvent('payu_initiate', {
        requestId: requestId || null,
        userId,
        method: 'POST',
        path: '/api/payments/payu/initiate',
        txnid,
        amount: toAmountString(amount),
        mode: config.mode,
        message: reuseTxnid ? 'Payment session re-issued' : 'Payment session created; order not yet placed'
    });

    return params;
};

// LEGACY FLOW (orders created before the payment-first change): re-issue a
// payment for an existing unpaid order row.
const initiateForExistingOrder = async ({ orderId, user, requestId }) => {
    assertConfigured();

    const order = await Order.findByPk(orderId);
    if (!order || (order.UserId !== user.id && user.role !== 'admin')) {
        const err = new Error('Order not found');
        err.status = 404;
        throw err;
    }
    if (String(order.paymentMethod || '').toLowerCase() === 'cod') {
        const err = new Error('Cash on Delivery orders do not require online payment');
        err.status = 400;
        throw err;
    }
    if (order.isPaid) {
        const err = new Error('Order is already paid');
        err.status = 400;
        throw err;
    }
    if (order.orderStatus === 'Cancelled') {
        const err = new Error('This order was cancelled; please place a new order');
        err.status = 400;
        throw err;
    }
    const amount = Number(order.totalPrice);
    if (!Number.isFinite(amount) || amount <= 0) {
        const err = new Error('Invalid order amount');
        err.status = 400;
        throw err;
    }

    const attemptsInWindow = await PaymentRecord.count({
        where: { OrderId: order.id, createdAt: { [Op.gte]: new Date(Date.now() - ATTEMPT_WINDOW_MS) } }
    });
    if (attemptsInWindow >= MAX_PAYMENT_ATTEMPTS_PER_USER) {
        const err = new Error('Too many payment attempts for this order, please contact support');
        err.status = 429;
        throw err;
    }
    const pendingRecord = await PaymentRecord.findOne({ where: { OrderId: order.id, status: 'Pending' } });
    if (pendingRecord) {
        const err = new Error('A previous payment for this order is still being processed. Please check the payment status before retrying.');
        err.status = 400;
        throw err;
    }
    const recentInitiated = await PaymentRecord.findOne({
        where: { OrderId: order.id, status: 'Initiated', createdAt: { [Op.gte]: new Date(Date.now() - RECENT_INITIATED_MS) } },
        order: [['createdAt', 'DESC']]
    });
    const txnid = recentInitiated ? recentInitiated.transactionId : generateTxnId();

    const customer = await User.findByPk(order.UserId, { attributes: ['name', 'email', 'phone'] });
    const shipping = order.shippingAddress || {};
    const fullName = String(shipping.fullName || customer?.name || '').trim();
    const firstname = fullName.split(/\s+/)[0] || 'Customer';
    const email = String(shipping.email || customer?.email || '').trim();
    const phone = String(shipping.phone || customer?.phone || '').trim();
    if (!email) {
        const err = new Error('Customer email is required for online payment');
        err.status = 400;
        throw err;
    }

    const payload = {
        items: [],
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        itemsPrice: Number(order.itemsPrice || 0),
        taxPrice: Number(order.taxPrice || 0),
        shippingPrice: Number(order.shippingPrice || 0),
        totalPrice: amount,
        fingerprint: `order-${order.id}`
    };
    const params = buildHashAndParams({ txnid, amount, payload, firstname, email, phone });

    if (!recentInitiated) {
        await sequelize.transaction(async (t) => {
            await PaymentRecord.create({
                transactionId: txnid,
                gateway: 'PayU',
                gatewayTransactionId: txnid,
                amount,
                currency: 'INR',
                netAmount: amount,
                status: 'Initiated',
                paymentMethod: String(order.paymentMethod || 'Online'),
                OrderId: order.id,
                UserId: order.UserId,
                customerEmail: email,
                customerName: firstname,
                paidAt: new Date(),
                notes: 'Legacy order payment initiation'
            }, { transaction: t });
            order.payuTxnId = txnid;
            await order.save({ transaction: t });
        });
    }

    logSecurityEvent('payu_initiate', {
        requestId: requestId || null,
        userId: order.UserId,
        method: 'POST',
        path: '/api/payments/payu/initiate',
        orderId: order.id,
        txnid,
        amount: toAmountString(amount),
        mode: config.mode
    });

    return params;
};

const upsertPaymentRecord = async ({ order, response, status, hashVerified, failureReason }, options = {}) => {
    const existing = await PaymentRecord.findOne({
        where: { transactionId: response.txnid, OrderId: order.id },
        ...options
    });

    const data = {
        gateway: 'PayU',
        gatewayTransactionId: response.txnid,
        gatewayPaymentId: response.mihpayid || null,
        amount: Number(order.totalPrice),
        currency: 'INR',
        netAmount: Number(order.totalPrice),
        status,
        paymentMethod: String(order.paymentMethod || 'Online'),
        paidAt: new Date(),
        hashVerified,
        gatewayResponse: response,
        failureReason: failureReason || null,
        customerEmail: response.email || order.paymentResult?.gatewayResponse?.email || null,
        customerName: response.firstname || null,
        OrderId: order.id,
        UserId: order.UserId
    };

    if (existing) {
        await existing.update(data, options);
        return existing;
    }
    return PaymentRecord.create(data, options);
};

const createInvoiceForOrder = async (order) => {
    const exists = await Invoice.findOne({ where: { OrderId: order.id } });
    if (exists) return exists;
    const lastInvoice = await Invoice.findOne({ order: [['invoiceNumber', 'DESC']] });
    const lastNum = lastInvoice ? parseInt(String(lastInvoice.invoiceNumber).split('-')[1], 10) : 0;
    const invoiceNumber = `INV-${(lastNum + 1).toString().padStart(6, '0')}`;
    return Invoice.create({
        invoiceNumber,
        subTotal: Number(order.itemsPrice || 0),
        gstTotal: Number(order.taxPrice || 0),
        grandTotal: Number(order.totalPrice || 0),
        status: 'Paid',
        OrderId: order.id,
        UserId: order.UserId
    });
};

const processLegacyOrderCallback = async ({ record, order, response, isSuccess, isPending, failureReason, requestId, result }) => {
    await sequelize.transaction(async (t) => {
        const fresh = await Order.findByPk(order.id, { transaction: t, lock: t.LOCK.UPDATE });
        if (fresh.isPaid) {
            result.alreadyPaid = true;
            result.order = fresh;
            return;
        }
        if (isSuccess) {
            fresh.isPaid = true;
            fresh.paidAt = new Date();
            fresh.payuPaymentId = response.mihpayid || null;
            fresh.paymentResult = {
                gateway: 'PayU',
                status: 'Captured',
                verified: true,
                txnid: response.txnid,
                mihpayid: response.mihpayid || null,
                update_time: new Date().toISOString(),
                gatewayResponse: response
            };
            await fresh.save({ transaction: t });
            await upsertPaymentRecord({
                order: fresh,
                response,
                status: 'Captured',
                hashVerified: true
            }, { transaction: t });
        } else {
            const mappedStatus = isPending ? 'Pending' : 'Failed';
            fresh.paymentResult = {
                gateway: 'PayU',
                status: mappedStatus,
                verified: true,
                txnid: response.txnid,
                mihpayid: response.mihpayid || null,
                update_time: new Date().toISOString(),
                gatewayResponse: response
            };
            await fresh.save({ transaction: t });
            await upsertPaymentRecord({
                order: fresh,
                response,
                status: mappedStatus,
                hashVerified: true,
                failureReason
            }, { transaction: t });
        }
        result.order = fresh;
    });
};

// Core callback processing. Idempotent: safe to replay success/failure callbacks
// (page refresh, gateway retries, duplicate events) without double-processing.
// `user` is optional: the response hash alone is unforgeable proof from the
// gateway, so a lost/expired session must not block verification of a real
// payment. The payment session is resolved from the txnid (source of truth);
// in the new flow the Order is materialized here, only after success.
const processPayuCallback = async ({ response, user, requestId }) => {
    const result = { valid: false, alreadyPaid: false, success: false, order: null, reason: null };

    if (!response || typeof response !== 'object' || !response.hash || !response.txnid || !response.status) {
        result.reason = 'Incomplete gateway response';
        return result;
    }

    const hashOk = verifyResponseHash(response, config.salt);
    if (!hashOk) {
        logSecurityEvent('payu_hash_mismatch', {
            requestId: requestId || null,
            userId: user?.id || null,
            ip: null,
            method: 'POST',
            path: '/api/payments/payu/callback',
            txnid: response.txnid,
            message: 'Response hash verification failed'
        });
        result.reason = 'Hash verification failed';
        return result;
    }
    result.valid = true;

    const record = await PaymentRecord.findOne({ where: { transactionId: response.txnid } });
    if (!record) {
        result.reason = 'Payment session not found';
        return result;
    }
    if (user && record.UserId !== user.id && user.role !== 'admin') {
        result.reason = 'Payment session not found or not authorized';
        return result;
    }
    if (!amountsMatch(record.amount, response.amount)) {
        logSecurityEvent('payu_amount_mismatch', {
            requestId: requestId || null,
            userId: record.UserId,
            method: 'POST',
            path: '/api/payments/payu/callback',
            txnid: response.txnid,
            expected: String(record.amount),
            received: String(response.amount),
            message: 'Callback amount does not match the payment session amount'
        });
        result.reason = 'Amount mismatch';
        return result;
    }

    const isSuccess = String(response.status).toLowerCase() === 'success';
    const isPending = String(response.status).toLowerCase() === 'pending';
    const failureReason = sanitizeReason(response.error_message || response.error);

    // Legacy path: the payment session was created for an existing order row.
    if (record.OrderId) {
        const order = await Order.findByPk(record.OrderId);
        if (!order) {
            result.reason = 'Order not found';
            return result;
        }
        if (!amountsMatch(order.totalPrice, response.amount)) {
            result.reason = 'Amount mismatch';
            return result;
        }
        await processLegacyOrderCallback({ record, order, response, isSuccess, isPending, failureReason, requestId, result });
        if (result.order) {
            result.success = isSuccess;
            if (isSuccess) {
                try { await createInvoiceForOrder(result.order); } catch (e) { console.error('[payu] invoice failed:', e.message); }
            }
            logSecurityEvent('payu_legacy_callback', {
                requestId: requestId || null,
                userId: result.order.UserId,
                method: 'POST',
                path: '/api/payments/payu/callback',
                orderId: result.order.id,
                txnid: response.txnid,
                status: String(response.status),
                message: isSuccess ? 'Legacy order marked paid' : 'Legacy order payment recorded'
            });
        }
        return result;
    }

    // New flow: materialize the order only on verified success.
    let orderId = null;
    await sequelize.transaction(async (t) => {
        const fresh = await PaymentRecord.findByPk(record.id, { transaction: t, lock: t.LOCK.UPDATE });

        if (fresh.status === 'Captured') {
            result.alreadyPaid = true;
            result.order = fresh.OrderId ? await Order.findByPk(fresh.OrderId, { transaction: t }) : null;
            return;
        }
        if (fresh.status === 'Expired') {
            const err = new Error('Payment session expired; your payment was not processed. Contact support if you were charged.');
            err.status = 409;
            throw err;
        }

        if (isSuccess) {
            // Guard against double-charge: same cart paid via another session.
            const fingerprint = fresh.payload?.fingerprint;
            if (fingerprint) {
                const duplicate = await PaymentRecord.findOne({
                    where: {
                        status: 'Captured',
                        id: { [Op.ne]: fresh.id },
                        [Op.and]: [
                            sequelize.where(sequelize.col('"PaymentRecord"."payload"'), Op.contains, { fingerprint })
                        ]
                    },
                    transaction: t
                });
                if (duplicate && duplicate.OrderId) {
                    result.alreadyPaid = true;
                    result.order = await Order.findByPk(duplicate.OrderId, { transaction: t });
                    return;
                }
            }

            const payload = fresh.payload || {};
            const order = await materializeOrder({
                userId: fresh.UserId,
                payload,
                transaction: t,
                paidFields: {
                    isPaid: true,
                    paidAt: new Date(),
                    payuPaymentId: response.mihpayid || null,
                    paymentResult: {
                        gateway: 'PayU',
                        status: 'Captured',
                        verified: true,
                        txnid: response.txnid,
                        mihpayid: response.mihpayid || null,
                        update_time: new Date().toISOString(),
                        gatewayResponse: response
                    }
                }
            });

            fresh.OrderId = order.id;
            fresh.status = 'Captured';
            fresh.hashVerified = true;
            fresh.gatewayPaymentId = response.mihpayid || null;
            fresh.gatewayResponse = response;
            fresh.customerEmail = response.email || payload.shippingAddress?.email || fresh.customerEmail || null;
            fresh.customerName = response.firstname || fresh.customerName || null;
            fresh.failureReason = null;
            fresh.paidAt = new Date();
            await fresh.save({ transaction: t });

            result.order = order;
            orderId = order.id;
            return;
        }

        // Failure / pending: release the stock reservation; no order is created.
        await releaseReservedStock(fresh.payload?.items || [], t);
        fresh.status = isPending ? 'Pending' : 'Failed';
        fresh.hashVerified = true;
        fresh.gatewayResponse = response;
        fresh.failureReason = failureReason;
        await fresh.save({ transaction: t });
        result.order = null;
    });

    if (isSuccess && orderId) {
        try {
            await createInvoiceForOrder(result.order);
        } catch (e) {
            console.error('[payu] Failed to generate invoice for order', orderId, e.message);
        }
        logSecurityEvent('payu_success_callback', {
            requestId: requestId || null,
            userId: record.UserId,
            method: 'POST',
            path: '/api/payments/payu/callback',
            orderId,
            txnid: response.txnid,
            mihpayid: response.mihpayid || null,
            amount: String(record.amount),
            message: 'Order placed after payment confirmed'
        });
        result.success = true;
    } else if (!result.alreadyPaid) {
        logSecurityEvent('payu_failure_callback', {
            requestId: requestId || null,
            userId: record.UserId,
            method: 'POST',
            path: '/api/payments/payu/callback',
            txnid: response.txnid,
            status: String(response.status),
            failureReason,
            message: 'Payment failed; stock reservation released, no order placed'
        });
        result.success = false;
    }

    return result;
};

module.exports = { initiatePayuPayment, initiateForExistingOrder, processPayuCallback };
