const { z } = require('zod');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const { saveDataUrl } = require('../utils/saveDataUrl');
const { createRazorpayOrder, verifyPaymentSignature } = require('../services/razorpayService');
const { sanitizeOrder } = require('../utils/serializers');

const TAX_RATE = (() => { const r = parseFloat(process.env.TAX_RATE || '0'); return Number.isFinite(r) ? r : 0; })();
const SHIPPING_FEE = parseFloat(process.env.SHIPPING_FEE || '0');
const MAX_QTY_PER_ITEM = 99;
const CUSTOM_PRODUCT_ID = 9999;

const isPositiveInt = (n) => Number.isInteger(n) && n > 0;

const shippingSchema = z.object({
    address: z.string().min(1).max(500),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(1).max(100),
    fullName: z.string().min(1).max(200).optional(),
    phone: z.string().max(20).optional()
});

const canAccessOrder = (order, user) =>
    order && (order.UserId === user.id || user.role === 'admin');

exports.addOrderItems = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    const parseResult = shippingSchema.safeParse(shippingAddress);
    if (!parseResult.success) {
        res.status(400);
        throw new Error('Shipping address must include address, city, state, postalCode, country');
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
            if (item.product === CUSTOM_PRODUCT_ID && item.designMeta) {
                continue;
            }
            res.status(404);
            throw new Error(`Product ${item.product} not found`);
        }
    }

    let itemsPrice = 0;
    for (const item of orderItems) {
        const product = productMap.get(item.product);
        if (!product && item.product === 9999) {
            const designMeta = item.designMeta || {};
            const materialPrice = (() => {
                const p = parseFloat(designMeta.materialPrice);
                return Number.isFinite(p) && p > 0 ? p : 399;
            })();
            const layerCount = parseInt(designMeta.layerCount, 10) || 0;
            const perUnitPrice = materialPrice + (layerCount > 1 ? (layerCount - 1) * 50 : 0);
            itemsPrice += Math.max(0, perUnitPrice) * item.qty;
        } else {
            itemsPrice += product.price * item.qty;
        }
    }
    const taxPrice = +(itemsPrice * TAX_RATE).toFixed(2);
    const shippingPrice = itemsPrice > 0 ? SHIPPING_FEE : 0;
    const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

    const normalizedMethod = paymentMethod.trim().toLowerCase();
    const isCod = normalizedMethod === 'cod';

    const razorpayPromise = isCod ? Promise.resolve(null) : createRazorpayOrder({
        amount: totalPrice,
        receipt: `order_${Date.now()}`
    }).catch(e => {
        console.warn('Razorpay unavailable:', e.message);
        return null;
    });

    // Limit concurrent image uploads to avoid network saturation
    async function saveDataUrlsConcurrent(urls, concurrency = 3) {
        const results = [];
        const queue = [...urls];
        async function worker() {
            while (queue.length > 0) {
                const url = queue.shift();
                results.push(await saveDataUrl(url));
            }
        }
        const workers = Array.from({ length: Math.min(concurrency, queue.length) || 1 }, () => worker());
        await Promise.all(workers);
        return results;
    }

    const [result, razorpayResult] = await Promise.all([
        sequelize.transaction(async (t) => {
            const order = await Order.create({
                UserId: req.user.id,
                shippingAddress,
                paymentMethod: paymentMethod.trim(),
                itemsPrice: +itemsPrice.toFixed(2),
                taxPrice,
                shippingPrice,
                totalPrice
            }, { transaction: t });

            const decrementOps = [];
            const orderItemData = [];

            for (const item of orderItems) {
                const product = productMap.get(item.product);

                if (!product && item.product === 9999) {
                    const dm = item.designMeta || {};

                    const rawThumb = dm.thumbnail || dm.bgImage || '';
                    const layerUrls = (dm.layers || [])
                        .filter(l => l.type === 'image' && l.url)
                        .map(l => l.url);

                    // Upload thumbnail and layers with limited concurrency
                    const allUrls = layerUrls.length > 0
                        ? [rawThumb, ...layerUrls]
                        : [rawThumb];
                    const [orderImage, ...uploadedImages] = await saveDataUrlsConcurrent(allUrls.filter(Boolean));

                    orderItemData.push({
                        OrderId: order.id,
                        ProductId: item.product,
                        name: dm.materialLabel ? `${dm.materialLabel} Custom Phone Case` : 'Custom Phone Case',
                        qty: item.qty,
                        image: orderImage || uploadedImages[0] || '',
                        price: dm.totalPrice || dm.materialPrice || 399,
                        productSnapshot: {
                            isCustom: true,
                            productName: dm.materialLabel ? `${dm.materialLabel} Custom Phone Case` : 'Custom Phone Case',
                            brand: dm.brand || null,
                            model: dm.modelLabel || null,
                            material: dm.materialLabel || null,
                            designPreview: orderImage || uploadedImages[0] || null,
                            uploadedImages: uploadedImages.filter(Boolean),
                            customText: dm.layers?.filter(l => l.type === 'text').map(l => l.text).join(', ') || null,
                            customizationNotes: null,
                            bgColor: dm.bgColor || null,
                            bgImage: dm.bgImage || null,
                            layers: dm.layers || [],
                            layerCount: dm.layerCount || 0,
                            designId: dm.designId || null
                        }
                    });
                    continue;
                }

                decrementOps.push(
                    Product.decrement('stock', {
                        by: item.qty,
                        where: { id: product.id, stock: { [Op.gte]: item.qty } },
                        transaction: t
                    }).then(([affected]) => {
                        if (affected === 0) {
                            const err = new Error(`Insufficient stock for "${product.name}"`);
                            err.status = 409;
                            throw err;
                        }
                    })
                );

                orderItemData.push({
                    OrderId: order.id,
                    ProductId: product.id,
                    name: product.name,
                    qty: item.qty,
                    image: product.image || '',
                    price: product.price,
                    productSnapshot: {
                        isCustom: false,
                        productName: product.name,
                        brand: product.brand || null,
                        model: product.phoneModel || null,
                        category: product.category || null,
                        sku: product.sku || null,
                        image: product.image || null,
                        price: product.price,
                        selectedVariant: item.selectedVariant || null,
                        color: item.color || product.attributes?.color || null,
                        material: item.material || product.materials?.[0] || null,
                        size: item.size || product.attributes?.size || null,
                        designType: product.attributes?.designType || null,
                        attributes: product.attributes || {}
                    }
                });
            }

            await Promise.all(decrementOps);
            await OrderItem.bulkCreate(orderItemData, { transaction: t });

            return order;
        }),
        razorpayPromise
    ]);

    const razorpayOrder = razorpayResult;
    const razorpayOrderId = razorpayOrder?.id || null;
    const razorpayKeyId = razorpayOrder ? process.env.RAZORPAY_KEY_ID : null;
    const razorpayAmount = razorpayOrder?.amount || null;
    const razorpayCurrency = razorpayOrder?.currency || null;

    if (razorpayOrderId) {
        result.razorpayOrderId = razorpayOrderId;
        await result.save();
    }

    // Reuse the order object + query items instead of a full re-fetch
    const items = await OrderItem.findAll({
        where: { OrderId: result.id },
        raw: true
    });
    const createdOrder = { ...result.get({ plain: true }), items };
    res.status(201).json({
        order: sanitizeOrder(createdOrder),
        razorpayOrderId,
        razorpayKeyId,
        amount: razorpayAmount,
        currency: razorpayCurrency
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

    if (!isCod) {
        if (typeof razorpayPaymentId !== 'string' || typeof razorpaySignature !== 'string') {
            res.status(400);
            throw new Error('razorpayPaymentId and razorpaySignature are required');
        }
        let valid;
        try {
            valid = verifyPaymentSignature({
                razorpayOrderId: order.razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
            });
        } catch (e) {
            res.status(503);
            throw new Error('Payment service unavailable');
        }
        if (!valid) {
            res.status(400);
            throw new Error('Invalid payment signature');
        }
    }

    order.isPaid = true;
    order.paidAt = new Date();
    if (razorpayPaymentId) order.razorpayPaymentId = razorpayPaymentId;
    order.paymentResult = {
        id: razorpayPaymentId || `cod_${order.id}`,
        status: isCod ? 'pending_cod' : 'captured',
        update_time: new Date().toISOString()
    };

    const updatedOrder = await order.save();

    try {
        const PaymentRecord = require('../models/PaymentRecord');
        const exists = await PaymentRecord.findOne({ where: { OrderId: order.id } });
        if (!exists) {
            await PaymentRecord.create({
                transactionId: `PAY-${order.id}-${Date.now().toString().slice(-6)}`,
                gateway: isCod ? 'COD' : 'Razorpay',
                gatewayTransactionId: order.razorpayOrderId || `cod_${order.id}`,
                gatewayPaymentId: razorpayPaymentId || `cod_${order.id}`,
                amount: Number(order.totalPrice),
                fee: 0,
                tax: 0,
                netAmount: Number(order.totalPrice),
                currency: 'INR',
                paymentMethod: order.paymentMethod || (isCod ? 'COD' : 'Razorpay'),
                status: isCod ? 'Pending' : 'Captured',
                paidAt: new Date(),
                OrderId: order.id,
                UserId: order.UserId,
                bankAccount: isCod ? 'Cash on Delivery' : 'Razorpay Primary'
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
