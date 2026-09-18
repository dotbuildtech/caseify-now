const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { Order } = require('../models/Order');
const User = require('../models/User');
const PaymentRecord = require('../models/PaymentRecord');
const Invoice = require('../models/Invoice');
const { config, assertConfigured, getRazorpayInstance } = require('../config/razorpay');
const { verifyPaymentSignature, verifyWebhookSignature, sanitizeReason } = require('../utils/razorpayUtils');
const { logSecurityEvent } = require('../utils/securityLog');
const {
    buildOrderPayload,
    reserveStock,
    releaseReservedStock,
    materializeOrder
} = require('./orderService');

const MAX_PAYMENT_ATTEMPTS_PER_USER = 15;
const RECENT_INITIATED_MS = 30 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;

const generateTxnId = () => {
    return `RZP${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

const amountsMatch = (a, b) => {
    const na = Math.round((Number(a) || 0) * 100);
    const nb = Math.round((Number(b) || 0) * 100);
    return na === nb;
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

/**
 * 1. Calculate amount on backend & create Razorpay Order
 * Creates a Razorpay order in paise, reserves stock, and records the session.
 */
const initiateRazorpayOrder = async ({ userId, orderItems, shippingAddress, paymentMethod, requestId }) => {
    assertConfigured();
    const razorpay = getRazorpayInstance();

    // Check recent attempts to mitigate abuse
    const attemptsInWindow = await PaymentRecord.count({
        where: { UserId: userId, createdAt: { [Op.gte]: new Date(Date.now() - ATTEMPT_WINDOW_MS) } }
    });
    if (attemptsInWindow >= MAX_PAYMENT_ATTEMPTS_PER_USER) {
        const err = new Error('Too many payment attempts. Please try again later or contact support.');
        err.status = 429;
        throw err;
    }

    // Step 1: Calculate amount strictly on backend (never trust client)
    const payload = await buildOrderPayload({ orderItems, shippingAddress, paymentMethod });
    const amountRupees = Number(payload.totalPrice);
    if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
        const err = new Error('Invalid calculated order amount');
        err.status = 400;
        throw err;
    }

    // Razorpay amount in integer paise (e.g. 499.00 -> 49900)
    const amountPaise = Math.round(amountRupees * 100);
    const receiptId = generateTxnId();

    const customer = await User.findByPk(userId, { attributes: ['id', 'name', 'email', 'phone'] });
    const shipping = payload.shippingAddress || {};
    const customerName = String(shipping.fullName || customer?.name || 'Customer').trim();
    const customerEmail = String(shipping.email || customer?.email || '').trim();
    const customerPhone = String(shipping.phone || customer?.phone || '').trim();

    // Create Razorpay Order via Official API
    let rzpOrder;
    try {
        rzpOrder = await razorpay.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: {
                userId: String(userId),
                receipt: receiptId,
                customerEmail: customerEmail.slice(0, 40)
            }
        });
    } catch (apiErr) {
        console.error('[Razorpay Order Creation Error]:', apiErr);
        const err = new Error(apiErr?.error?.description || 'Failed to create payment session with Razorpay');
        err.status = 502;
        throw err;
    }

    // Atomically reserve inventory and save PaymentRecord
    await sequelize.transaction(async (t) => {
        await reserveStock(payload.items, t);
        await PaymentRecord.create({
            transactionId: receiptId,
            gateway: 'Razorpay',
            gatewayTransactionId: rzpOrder.id,
            gatewayPaymentId: null,
            amount: amountRupees,
            currency: 'INR',
            netAmount: amountRupees,
            status: 'Initiated',
            paymentMethod: payload.paymentMethod || 'Razorpay',
            OrderId: null,
            UserId: userId,
            customerEmail,
            customerName,
            payload,
            paidAt: new Date(),
            notes: `Razorpay order created: ${rzpOrder.id}`
        }, { transaction: t });
    });

    logSecurityEvent('razorpay_order_created', {
        requestId: requestId || null,
        userId,
        method: 'POST',
        path: '/api/payments/razorpay/create-order',
        orderId: rzpOrder.id,
        receiptId,
        amount: String(amountRupees),
        currency: 'INR',
        message: 'Razorpay order created with server-calculated price'
    });

    return {
        keyId: config.keyId,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount, // in paise
        currency: rzpOrder.currency,
        receipt: receiptId,
        prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone
        },
        totals: {
            itemsPrice: payload.itemsPrice,
            taxPrice: payload.taxPrice,
            shippingPrice: payload.shippingPrice,
            totalPrice: payload.totalPrice
        }
    };
};

/**
 * 2. Verify Payment Signature & Materialize Order
 * Verifies HMAC SHA256 signature, validates ownership, and places the order idempotently.
 */
const verifyRazorpayPayment = async ({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    user,
    requestId
}) => {
    assertConfigured();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        const err = new Error('Missing Razorpay verification parameters');
        err.status = 400;
        throw err;
    }

    // Step 1: Verify HMAC Signature with constant-time comparison
    const isSignatureValid = verifyPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        secret: config.keySecret
    });

    if (!isSignatureValid) {
        logSecurityEvent('razorpay_signature_mismatch', {
            requestId: requestId || null,
            userId: user?.id || null,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            message: 'Razorpay payment signature mismatch detected'
        });
        const err = new Error('Payment signature verification failed');
        err.status = 400;
        throw err;
    }

    // Step 2: Retrieve the initiated PaymentRecord
    const record = await PaymentRecord.findOne({
        where: { gatewayTransactionId: razorpay_order_id }
    });

    if (!record) {
        const err = new Error('Payment record not found for this Razorpay order');
        err.status = 404;
        throw err;
    }

    // Step 3: Validate order ownership
    if (user && record.UserId !== user.id && user.role !== 'admin') {
        logSecurityEvent('razorpay_ownership_mismatch', {
            requestId: requestId || null,
            userId: user?.id || null,
            recordUserId: record.UserId,
            orderId: razorpay_order_id,
            message: 'User attempted to verify a payment belonging to another account'
        });
        const err = new Error('Unauthorized payment verification');
        err.status = 403;
        throw err;
    }

    // Step 4: Idempotent order materialization
    let resultOrder = null;
    let alreadyPaid = false;

    await sequelize.transaction(async (t) => {
        const freshRecord = await PaymentRecord.findByPk(record.id, {
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (freshRecord.status === 'Captured' && freshRecord.OrderId) {
            alreadyPaid = true;
            resultOrder = await Order.findByPk(freshRecord.OrderId, { transaction: t });
            return;
        }

        const payload = freshRecord.payload || {};
        const order = await materializeOrder({
            userId: freshRecord.UserId,
            payload,
            transaction: t,
            paidFields: {
                isPaid: true,
                paidAt: new Date(),
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paymentResult: {
                    gateway: 'Razorpay',
                    status: 'Captured',
                    verified: true,
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                    signature: razorpay_signature,
                    update_time: new Date().toISOString()
                }
            }
        });

        freshRecord.OrderId = order.id;
        freshRecord.status = 'Captured';
        freshRecord.hashVerified = true;
        freshRecord.gatewayPaymentId = razorpay_payment_id;
        freshRecord.paidAt = new Date();
        freshRecord.gatewayResponse = {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        };
        await freshRecord.save({ transaction: t });

        resultOrder = order;
    });

    if (resultOrder) {
        try {
            await createInvoiceForOrder(resultOrder);
        } catch (invErr) {
            console.error('[razorpay] Invoice generation warning:', invErr.message);
        }
    }

    logSecurityEvent('razorpay_payment_verified', {
        requestId: requestId || null,
        userId: record.UserId,
        orderId: resultOrder?.id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        alreadyPaid,
        message: 'Razorpay payment successfully verified and order confirmed'
    });

    return {
        success: true,
        alreadyPaid,
        orderId: resultOrder?.id,
        amount: Number(resultOrder?.totalPrice || record.amount),
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id
    };
};

/**
 * 3. Process Razorpay Webhooks (Server-to-Server)
 * Idempotently handles asynchronous event notifications from Razorpay.
 */
const processRazorpayWebhook = async ({ rawBody, signature, eventData, requestId }) => {
    if (!config.webhookSecret) {
        console.warn('[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not configured; skipping webhook processing');
        return { processed: false, reason: 'Webhook secret not configured' };
    }

    const isValid = verifyWebhookSignature({
        rawBody,
        signature,
        webhookSecret: config.webhookSecret
    });

    if (!isValid) {
        logSecurityEvent('razorpay_webhook_invalid_signature', {
            requestId: requestId || null,
            message: 'Webhook signature verification failed'
        });
        const err = new Error('Invalid webhook signature');
        err.status = 400;
        throw err;
    }

    const event = eventData?.event;
    const payload = eventData?.payload;

    logSecurityEvent('razorpay_webhook_received', {
        requestId: requestId || null,
        event,
        message: `Processing Razorpay webhook event: ${event}`
    });

    if (event === 'payment.captured' || event === 'order.paid') {
        const paymentEntity = payload?.payment?.entity;
        const orderEntity = payload?.order?.entity;
        const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
        const rzpPaymentId = paymentEntity?.id;

        if (!rzpOrderId) return { processed: true, message: 'No order ID in event' };

        const record = await PaymentRecord.findOne({
            where: { gatewayTransactionId: rzpOrderId }
        });

        if (!record) {
            return { processed: true, message: 'Payment record not found for webhook event' };
        }

        // Assert payment amount and currency match recorded expectation
        const webhookAmountPaise = paymentEntity?.amount;
        const expectedAmountPaise = Math.round(Number(record.amount) * 100);
        const webhookCurrency = (paymentEntity?.currency || 'INR').toUpperCase();
        const expectedCurrency = (record.currency || 'INR').toUpperCase();

        if (webhookAmountPaise && webhookAmountPaise !== expectedAmountPaise) {
            logSecurityEvent('razorpay_webhook_amount_mismatch', {
                requestId: requestId || null,
                recordId: record.id,
                expectedAmount: expectedAmountPaise,
                webhookAmount: webhookAmountPaise,
                message: 'Razorpay webhook payment amount does not match expected order amount'
            });
            return { processed: false, reason: 'Amount mismatch detected' };
        }

        if (webhookCurrency && webhookCurrency !== expectedCurrency) {
            logSecurityEvent('razorpay_webhook_currency_mismatch', {
                requestId: requestId || null,
                recordId: record.id,
                expectedCurrency,
                webhookCurrency,
                message: 'Razorpay webhook payment currency does not match expected order currency'
            });
            return { processed: false, reason: 'Currency mismatch detected' };
        }

        // Idempotent capture & order materialization
        await sequelize.transaction(async (t) => {
            const fresh = await PaymentRecord.findByPk(record.id, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (fresh.status === 'Captured') {
                return;
            }

            const orderPayload = fresh.payload || {};
            const order = await materializeOrder({
                userId: fresh.UserId,
                payload: orderPayload,
                transaction: t,
                paidFields: {
                    isPaid: true,
                    paidAt: new Date(),
                    razorpayOrderId: rzpOrderId,
                    razorpayPaymentId: rzpPaymentId,
                    paymentResult: {
                        gateway: 'Razorpay',
                        status: 'Captured',
                        verified: true,
                        orderId: rzpOrderId,
                        paymentId: rzpPaymentId,
                        source: 'webhook',
                        update_time: new Date().toISOString()
                    }
                }
            });

            fresh.OrderId = order.id;
            fresh.status = 'Captured';
            fresh.hashVerified = true;
            fresh.gatewayPaymentId = rzpPaymentId || fresh.gatewayPaymentId;
            fresh.gatewayResponse = eventData;
            fresh.paidAt = new Date();
            await fresh.save({ transaction: t });

            try {
                await createInvoiceForOrder(order);
            } catch (e) {
                console.error('[razorpay-webhook] Invoice error:', e.message);
            }
        });

        return { processed: true, event };
    }

    if (event === 'refund.processed') {
        const refundEntity = payload?.refund?.entity;
        const rzpPaymentId = refundEntity?.payment_id;
        if (rzpPaymentId) {
            const record = await PaymentRecord.findOne({
                where: { gatewayPaymentId: rzpPaymentId }
            });
            if (record) {
                await sequelize.transaction(async (t) => {
                    const fresh = await PaymentRecord.findByPk(record.id, { transaction: t, lock: t.LOCK.UPDATE });
                    if (fresh) {
                        fresh.status = 'Refunded';
                        fresh.gatewayResponse = eventData;
                        await fresh.save({ transaction: t });

                        if (fresh.OrderId) {
                            const order = await Order.findByPk(fresh.OrderId, { transaction: t, lock: t.LOCK.UPDATE });
                            if (order) {
                                order.orderStatus = 'Cancelled';
                                await order.save({ transaction: t });
                            }
                        }
                    }
                });
                logSecurityEvent('razorpay_webhook_refund_processed', {
                    requestId: requestId || null,
                    paymentId: rzpPaymentId,
                    recordId: record.id,
                    amount: refundEntity?.amount
                });
            }
        }
        return { processed: true, event };
    }

    if (event === 'payment.dispute.created' || event === 'payment.dispute.lost' || event === 'payment.dispute.won') {
        const disputeEntity = payload?.dispute?.entity;
        const rzpPaymentId = disputeEntity?.payment_id;
        if (rzpPaymentId) {
            const record = await PaymentRecord.findOne({
                where: { gatewayPaymentId: rzpPaymentId }
            });
            if (record) {
                const disputeStatus = event === 'payment.dispute.created' ? 'Disputed' : (event === 'payment.dispute.lost' ? 'DisputeLost' : 'DisputeWon');
                record.notes = `Dispute event ${event}: ${disputeEntity?.id || ''} - ${disputeEntity?.reason_code || ''}`;
                if (event === 'payment.dispute.created' || event === 'payment.dispute.lost') {
                    record.status = disputeStatus;
                }
                await record.save();
                logSecurityEvent(`razorpay_webhook_${event.replace(/\./g, '_')}`, {
                    requestId: requestId || null,
                    disputeId: disputeEntity?.id,
                    paymentId: rzpPaymentId,
                    amount: disputeEntity?.amount
                });
            }
        }
        return { processed: true, event };
    }

    if (event === 'payment.failed') {
        const paymentEntity = payload?.payment?.entity;
        const rzpOrderId = paymentEntity?.order_id;
        const reason = sanitizeReason(paymentEntity?.error_description || paymentEntity?.error_reason);

        if (rzpOrderId) {
            const record = await PaymentRecord.findOne({
                where: { gatewayTransactionId: rzpOrderId }
            });

            if (record && record.status === 'Initiated') {
                await sequelize.transaction(async (t) => {
                    const fresh = await PaymentRecord.findByPk(record.id, {
                        transaction: t,
                        lock: t.LOCK.UPDATE
                    });
                    if (fresh && fresh.status === 'Initiated') {
                        await releaseReservedStock(fresh.payload?.items || [], t);
                        fresh.status = 'Failed';
                        fresh.failureReason = reason;
                        fresh.gatewayResponse = eventData;
                        await fresh.save({ transaction: t });
                    }
                });
            }
        }
        return { processed: true, event };
    }

    return { processed: true, ignored: true, event };
};

/**
 * 4. Reconcile an Initiated Payment Record by querying Razorpay API directly
 * Used by background reconciliation job if a webhook or client redirect was dropped.
 */
const reconcileInitiatedPayment = async (paymentRecordId) => {
    assertConfigured();
    const razorpay = getRazorpayInstance();

    const record = await PaymentRecord.findByPk(paymentRecordId);
    if (!record || record.status !== 'Initiated' || !record.gatewayTransactionId) {
        return { reconciled: false, reason: 'Record not eligible for reconciliation' };
    }

    try {
        const rzpOrder = await razorpay.orders.fetch(record.gatewayTransactionId);
        if (!rzpOrder) return { reconciled: false, reason: 'Order not found in Razorpay' };

        if (rzpOrder.status === 'paid') {
            const payments = await razorpay.orders.fetchPayments(record.gatewayTransactionId);
            const capturedPayment = (payments?.items || []).find((p) => p.status === 'captured');

            if (capturedPayment) {
                let resultOrder = null;
                await sequelize.transaction(async (t) => {
                    const freshRecord = await PaymentRecord.findByPk(record.id, { transaction: t, lock: t.LOCK.UPDATE });
                    if (freshRecord.status === 'Captured') return;

                    const payload = freshRecord.payload || {};
                    const order = await materializeOrder({
                        userId: freshRecord.UserId,
                        payload,
                        transaction: t,
                        paidFields: {
                            isPaid: true,
                            paidAt: new Date(),
                            razorpayOrderId: rzpOrder.id,
                            razorpayPaymentId: capturedPayment.id,
                            paymentResult: {
                                gateway: 'Razorpay',
                                status: 'Captured',
                                verified: true,
                                orderId: rzpOrder.id,
                                paymentId: capturedPayment.id,
                                source: 'reconciliation_job',
                                update_time: new Date().toISOString()
                            }
                        }
                    });

                    freshRecord.OrderId = order.id;
                    freshRecord.status = 'Captured';
                    freshRecord.hashVerified = true;
                    freshRecord.gatewayPaymentId = capturedPayment.id;
                    freshRecord.paidAt = new Date();
                    await freshRecord.save({ transaction: t });

                    resultOrder = order;
                });

                if (resultOrder) {
                    try {
                        await createInvoiceForOrder(resultOrder);
                    } catch (e) {
                        console.error('[reconciliation] Invoice error:', e.message);
                    }
                }

                logSecurityEvent('razorpay_payment_reconciled', {
                    recordId: record.id,
                    rzpOrderId: rzpOrder.id,
                    paymentId: capturedPayment.id,
                    message: 'Payment reconciled via Razorpay API fallback worker'
                });

                return { reconciled: true, status: 'Captured', orderId: resultOrder?.id };
            }
        }
        return { reconciled: false, rzpStatus: rzpOrder.status };
    } catch (err) {
        const errorDetail = err?.error?.description || err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        console.error(`[razorpay-reconciliation] Failed for record ${record.id}:`, errorDetail);
        return { reconciled: false, error: errorDetail };
    }
};

module.exports = {
    initiateRazorpayOrder,
    verifyRazorpayPayment,
    processRazorpayWebhook,
    reconcileInitiatedPayment
};
