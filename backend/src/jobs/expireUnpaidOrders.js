const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');
const PaymentRecord = require('../models/PaymentRecord');
const { releaseReservedStock } = require('../services/orderService');
const { logSecurityEvent } = require('../utils/securityLog');

const EXPIRY_HOURS = Math.max(1, parseInt(process.env.UNPAID_ORDER_EXPIRY_HOURS, 10) || 48);
const INITIATION_EXPIRY_MINUTES = Math.max(10, parseInt(process.env.INITIATION_EXPIRY_MINUTES, 10) || 60);
const RUN_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Cancels online-payment orders that were never paid and restores their stock.
// COD orders are intentionally excluded (stock is held until delivery).
const expireUnpaidOrders = async () => {
    const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);

    const orders = await Order.findAll({
        where: {
            isPaid: false,
            orderStatus: 'Ordered',
            createdAt: { [Op.lt]: cutoff },
            paymentMethod: { [Op.notLike]: '%cod%' }
        },
        include: [{ model: OrderItem, as: 'items' }]
    });

    let cancelled = 0;
    for (const order of orders) {
        // Belt-and-braces: the SQL filter uses case-sensitive NOT LIKE, so
        // re-check on the value itself to never cancel a COD order.
        if (String(order.paymentMethod || '').toLowerCase().includes('cod')) continue;

        const captured = await PaymentRecord.findOne({
            where: { OrderId: order.id, status: 'Captured' }
        });
        if (captured) continue;

        await sequelize.transaction(async (t) => {
            const fresh = await Order.findByPk(order.id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!fresh || fresh.isPaid || fresh.orderStatus !== 'Ordered') return;

            for (const item of order.items || []) {
                if (item.ProductId && item.ProductId !== 9999) {
                    await Product.increment('stock', {
                        by: item.qty,
                        where: { id: item.ProductId },
                        transaction: t
                    });
                }
            }

            fresh.orderStatus = 'Cancelled';
            await fresh.save({ transaction: t });
        });

        cancelled += 1;
        logSecurityEvent('unpaid_order_expired', {
            orderId: order.id,
            userId: order.UserId,
            method: 'JOB',
            path: '/jobs/expire-unpaid-orders',
            hours: EXPIRY_HOURS,
            message: 'Unpaid order cancelled and stock restored'
        });
    }

    if (cancelled > 0) {
        console.log(`[job] expireUnpaidOrders: cancelled ${cancelled} unpaid order(s)`);
    }
    return cancelled;
};

// Payment-first flow: an Initiated session holds a stock reservation but no
// order row. If the payment never completes, release the reservation and mark
// the session Expired so late callbacks are rejected.
const expireInitiatedSessions = async () => {
    const cutoff = new Date(Date.now() - INITIATION_EXPIRY_MINUTES * 60 * 1000);

    const sessions = await PaymentRecord.findAll({
        where: {
            OrderId: null,
            status: 'Initiated',
            createdAt: { [Op.lt]: cutoff }
        }
    });

    let expired = 0;
    for (const session of sessions) {
        await sequelize.transaction(async (t) => {
            const fresh = await PaymentRecord.findByPk(session.id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!fresh || fresh.status !== 'Initiated') return;

            await releaseReservedStock(fresh.payload?.items || [], t);
            fresh.status = 'Expired';
            fresh.payload = null;
            await fresh.save({ transaction: t });
        });

        expired += 1;
        logSecurityEvent('payment_session_expired', {
            userId: session.UserId,
            txnid: session.transactionId,
            method: 'JOB',
            path: '/jobs/expire-unpaid-orders',
            minutes: INITIATION_EXPIRY_MINUTES,
            message: 'Payment session expired; stock reservation released, no order placed'
        });
    }

    if (expired > 0) {
        console.log(`[job] expireInitiatedSessions: expired ${expired} payment session(s)`);
    }
    return expired;
};

const runJobs = async () => {
    await expireUnpaidOrders();
    await expireInitiatedSessions();
};

const startUnpaidOrderExpiry = () => {
    runJobs().catch((e) => console.error('[job] initial run failed:', e.message));
    setInterval(() => {
        runJobs().catch((e) => console.error('[job] run failed:', e.message));
    }, RUN_INTERVAL_MS);
};

module.exports = { expireUnpaidOrders, expireInitiatedSessions, startUnpaidOrderExpiry, EXPIRY_HOURS, INITIATION_EXPIRY_MINUTES };
