const { sequelize } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { Order, OrderItem } = require('../models/Order');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const { sanitizeOrder } = require('../utils/serializers');
const { buildOrderPayload, reserveStock, materializeOrder } = require('../services/orderService');

const canAccessOrder = (order, user) =>
    order && (order.UserId === user.id || user.role === 'admin');

// COD orders are placed immediately. Online orders are NOT created here —
// they are materialized only after PayU confirms the payment (see payuService).
exports.addOrderItems = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    const normalizedMethod = String(paymentMethod || '').trim().toLowerCase();
    if (normalizedMethod !== 'cod') {
        res.status(400);
        throw new Error('Online orders are placed only after the payment is confirmed; please pay online');
    }

    const payload = await buildOrderPayload({ orderItems, shippingAddress, paymentMethod });

    const result = await sequelize.transaction(async (t) => {
        await reserveStock(payload.items, t);
        return materializeOrder({ userId: req.user.id, payload, transaction: t });
    });

    const items = await OrderItem.findAll({
        where: { OrderId: result.id },
        raw: true
    });
    const createdOrder = { ...result.get({ plain: true }), items };
    res.status(201).json({
        order: sanitizeOrder(createdOrder),
        paymentRequired: false
    });
});

exports.getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [
            { model: User, attributes: ['name', 'email'] },
            { model: OrderItem, as: 'items' }
        ]
    });

    if (!canAccessOrder(order, req.user)) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.json(sanitizeOrder(order));
});

exports.updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id);
    if (!canAccessOrder(order, req.user)) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.isPaid) {
        res.status(400);
        throw new Error('Order is already paid');
    }

    const normalizedMethod = String(order.paymentMethod || '').toLowerCase();
    const isCod = normalizedMethod === 'cod';

    if (!isCod && !(order.paymentResult?.verified === true && order.paymentResult?.status === 'Captured')) {
        res.status(400);
        throw new Error('Online payments are finalized through the payment gateway callback');
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
        ...(order.paymentResult || {}),
        id: order.payuPaymentId || `cod_${order.id}`,
        status: isCod ? 'pending_cod' : (order.paymentResult?.status || 'Captured'),
        update_time: new Date().toISOString()
    };

    const updatedOrder = await order.save();

    try {
        const PaymentRecord = require('../models/PaymentRecord');
        const exists = await PaymentRecord.findOne({ where: { OrderId: order.id } });
        if (!exists) {
            await PaymentRecord.create({
                transactionId: `PAY-${order.id}-${Date.now().toString().slice(-6)}`,
                gateway: isCod ? 'COD' : 'PayU',
                gatewayTransactionId: order.payuTxnId || `cod_${order.id}`,
                gatewayPaymentId: order.payuPaymentId || `cod_${order.id}`,
                amount: Number(order.totalPrice),
                fee: 0,
                tax: 0,
                netAmount: Number(order.totalPrice),
                currency: 'INR',
                paymentMethod: order.paymentMethod || (isCod ? 'COD' : 'PayU'),
                status: isCod ? 'Pending' : 'Captured',
                paidAt: new Date(),
                OrderId: order.id,
                UserId: order.UserId,
                bankAccount: isCod ? 'Cash on Delivery' : 'PayU Primary'
            });
        }
    } catch (e) {
        console.error('Failed to record payment:', e.message);
    }

    res.json(updatedOrder);
});

exports.getMyOrders = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const { count, rows } = await Order.findAndCountAll({
        where: { UserId: req.user.id },
        include: [{ model: OrderItem, as: 'items' }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });
    res.json({ data: rows.map(sanitizeOrder), pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
});

exports.getOrders = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const { count, rows } = await Order.findAndCountAll({
        include: [
            { model: User, attributes: ['id', 'name', 'email', 'phone'] },
            { model: OrderItem, as: 'items' }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true
    });
    res.json({ data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const allowed = ['Ordered', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const { status } = req.body;

    if (!allowed.includes(status)) {
        res.status(400);
        throw new Error(`Status must be one of: ${allowed.join(', ')}`);
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (!['Ordered', 'Processing', 'Shipped'].includes(order.orderStatus)
        && status !== order.orderStatus) {
        res.status(400);
        throw new Error(`Cannot transition from ${order.orderStatus} to ${status}`);
    }

    order.orderStatus = status;
    if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
    }
    const updatedOrder = await order.save();
    res.json(updatedOrder);
});
