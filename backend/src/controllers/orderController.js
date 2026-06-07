const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const { createRazorpayOrder, verifyPaymentSignature } = require('../services/razorpayService');

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0');
const SHIPPING_FEE = parseFloat(process.env.SHIPPING_FEE || '0');
const MAX_QTY_PER_ITEM = 99;

const isPositiveInt = (n) => Number.isInteger(n) && n > 0;

const canAccessOrder = (order, user) =>
    order && (order.UserId === user.id || user.role === 'admin');

exports.addOrderItems = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    if (!shippingAddress || typeof shippingAddress !== 'object') {
        res.status(400);
        throw new Error('Shipping address is required');
    }

    if (typeof paymentMethod !== 'string' || !paymentMethod.trim()) {
        res.status(400);
        throw new Error('Payment method is required');
    }

    for (const item of orderItems) {
        if (!isPositiveInt(item.product) || !isPositiveInt(item.qty) || item.qty > MAX_QTY_PER_ITEM) {
            res.status(400);
            throw new Error(`Each item must include a valid product id and qty (1-${MAX_QTY_PER_ITEM})`);
        }
    }

    const productIds = [...new Set(orderItems.map((i) => i.product))];
    const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of orderItems) {
        const product = productMap.get(item.product);
        if (!product) {
            res.status(404);
            throw new Error(`Product ${item.product} not found`);
        }
    }

    let itemsPrice = 0;
    for (const item of orderItems) {
        const product = productMap.get(item.product);
        itemsPrice += product.price * item.qty;
    }
    const taxPrice = +(itemsPrice * TAX_RATE).toFixed(2);
    const shippingPrice = itemsPrice > 0 ? SHIPPING_FEE : 0;
    const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

    const result = await sequelize.transaction(async (t) => {
        const order = await Order.create({
            UserId: req.user.id,
            shippingAddress,
            paymentMethod: paymentMethod.trim(),
            itemsPrice: +itemsPrice.toFixed(2),
            taxPrice,
            shippingPrice,
            totalPrice
        }, { transaction: t });

        for (const item of orderItems) {
            const product = productMap.get(item.product);

            const [affected] = await Product.decrement('stock', {
                by: item.qty,
                where: { id: product.id, stock: { [Op.gte]: item.qty } },
                transaction: t
            });

            if (affected === 0) {
                res.status(409);
                throw new Error(`Insufficient stock for "${product.name}"`);
            }

            await OrderItem.create({
                OrderId: order.id,
                ProductId: product.id,
                name: product.name,
                qty: item.qty,
                image: product.image || '',
                price: product.price
            }, { transaction: t });
        }

        return order;
    });

    const razorpayOrder = await createRazorpayOrder({
        amount: totalPrice,
        receipt: `order_${result.id}`
    });

    result.razorpayOrderId = razorpayOrder.id;
    await result.save();

    const createdOrder = await Order.findByPk(result.id, { include: [{ model: OrderItem, as: 'items' }] });
    res.status(201).json({
        order: createdOrder,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
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

    res.json(order);
});

exports.updateOrderToPaid = asyncHandler(async (req, res) => {
    const { razorpayPaymentId, razorpaySignature } = req.body;

    if (typeof razorpayPaymentId !== 'string' || typeof razorpaySignature !== 'string') {
        res.status(400);
        throw new Error('razorpayPaymentId and razorpaySignature are required');
    }

    const order = await Order.findByPk(req.params.id);
    if (!canAccessOrder(order, req.user)) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.isPaid) {
        res.status(400);
        throw new Error('Order is already paid');
    }

    const valid = verifyPaymentSignature({
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
    });

    if (!valid) {
        res.status(400);
        throw new Error('Invalid payment signature');
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.razorpayPaymentId = razorpayPaymentId;
    order.paymentResult = {
        id: razorpayPaymentId,
        status: 'captured',
        update_time: new Date().toISOString()
    };

    const updatedOrder = await order.save();

    // Record a payment transaction
    try {
        const PaymentRecord = require('../models/PaymentRecord');
        const exists = await PaymentRecord.findOne({ where: { OrderId: order.id } });
        if (!exists) {
            const subTotal = +(Number(order.totalPrice) - Number(order.taxPrice || 0)).toFixed(2);
            await PaymentRecord.create({
                transactionId: `PAY-${order.id}-${Date.now().toString().slice(-6)}`,
                gateway: 'Razorpay',
                gatewayTransactionId: order.razorpayOrderId,
                gatewayPaymentId: razorpayPaymentId,
                amount: Number(order.totalPrice),
                fee: 0,
                tax: 0,
                netAmount: Number(order.totalPrice),
                currency: 'INR',
                paymentMethod: order.paymentMethod || 'Razorpay',
                status: 'Captured',
                paidAt: new Date(),
                OrderId: order.id,
                UserId: order.UserId,
                bankAccount: 'Razorpay Primary'
            });
        }
    } catch (e) {
        // don't fail the request if recording fails
        console.error('Failed to record payment:', e.message);
    }

    res.json(updatedOrder);
});

exports.getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.findAll({
        where: { UserId: req.user.id },
        include: [{ model: OrderItem, as: 'items' }],
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
});

exports.getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.findAll({
        include: [
            { model: User, attributes: ['id', 'name'] },
            { model: OrderItem, as: 'items' }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
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
