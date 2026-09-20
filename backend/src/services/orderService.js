const { z } = require('zod');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { saveDataUrl } = require('../utils/saveDataUrl');
const { computeStudioPrice, MAX_DESIGN_LAYERS } = require('../utils/studioPricing');
const { getStoreSettings } = require('../utils/storeSettings');
const Material = require('../models/Material');

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

// Validates the order request and computes every price server-side.
// Client-supplied prices (designMeta.materialPrice / totalPrice / selectedVariant)
// are NEVER trusted. Returns a normalized payload that can be stored in a
// PaymentRecord while the payment is in flight and materialized into an Order
// only after the gateway confirms the payment.
const buildOrderPayload = async ({ orderItems, shippingAddress, paymentMethod }) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        const err = new Error('No order items');
        err.status = 400;
        throw err;
    }
    const parseResult = shippingSchema.safeParse(shippingAddress);
    if (!parseResult.success) {
        const err = new Error('Shipping address must include address, city, state, postalCode, country');
        err.status = 400;
        throw err;
    }
    if (typeof paymentMethod !== 'string' || !paymentMethod.trim()) {
        const err = new Error('Payment method is required');
        err.status = 400;
        throw err;
    }
    for (const item of orderItems) {
        if (!isPositiveInt(item.product) || !isPositiveInt(item.qty) || item.qty > MAX_QTY_PER_ITEM) {
            const err = new Error(`Each item must include a valid product id and qty (1-${MAX_QTY_PER_ITEM})`);
            err.status = 400;
            throw err;
        }
    }

    const productIds = [...new Set(orderItems.map((i) => i.product))];
    const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of orderItems) {
        const product = productMap.get(item.product);
        if (!product) {
            if (item.product === CUSTOM_PRODUCT_ID && item.designMeta) {
                const layers = item.designMeta.layers || [];
                if (layers.length > MAX_DESIGN_LAYERS) {
                    const err = new Error(`Design cannot exceed ${MAX_DESIGN_LAYERS} layers`);
                    err.status = 400;
                    throw err;
                }
                continue;
            }
            const err = new Error(`Product ${item.product} not found`);
            err.status = 404;
            throw err;
        }
    }

    // Resolve variants server-side so prices never come from the client
    const variantIds = [...new Set(orderItems.map((i) => i.selectedVariant?.id).filter((v) => Number.isInteger(v)))];
    const variants = variantIds.length > 0
        ? await ProductVariant.findAll({ where: { id: { [Op.in]: variantIds } } })
        : [];
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const settings = await getStoreSettings();

    const items = [];
    let itemsPrice = 0;
    let totalTax = 0;

    for (const item of orderItems) {
        const product = productMap.get(item.product);
        if (!product && item.product === CUSTOM_PRODUCT_ID) {
            const dm = item.designMeta || {};
            const pricing = await computeStudioPrice({ materialId: dm.materialId, layerCount: dm.layerCount });
            const unitPrice = Math.max(0, pricing.perUnitPrice);

            let customGstRate = Number(settings.defaultGstRate || 18);
            if (dm.materialId) {
                const mat = await Material.findOne({
                    where: { [Op.or]: [{ slug: String(dm.materialId) }, (!isNaN(dm.materialId) ? { id: parseInt(dm.materialId, 10) } : null)].filter(Boolean) }
                });
                if (mat && mat.gstRate != null) {
                    customGstRate = Number(mat.gstRate);
                }
            }

            const lineItemPrice = unitPrice * item.qty;
            const lineTax = +(lineItemPrice * (customGstRate / 100)).toFixed(2);
            itemsPrice += lineItemPrice;
            totalTax += lineTax;

            items.push({
                type: 'custom',
                product: item.product,
                qty: item.qty,
                price: unitPrice,
                designMeta: dm,
                gstRate: customGstRate,
                gstAmount: lineTax,
                snapshot: {
                    isCustom: true,
                    productName: 'Custom Designed Case',
                    price: unitPrice,
                    materialId: dm.materialId || null,
                    gstRate: customGstRate,
                    gstAmount: lineTax
                }
            });
        } else {
            const variant = variantMap.get(item.selectedVariant?.id);
            const unitPrice = Math.max(0, variant && variant.price != null ? Number(variant.price) : Number(product.price));
            const itemGstRate = Number(product.gstRate ?? settings.defaultGstRate ?? 18);
            const lineItemPrice = unitPrice * item.qty;
            const lineTax = +(lineItemPrice * (itemGstRate / 100)).toFixed(2);

            itemsPrice += lineItemPrice;
            totalTax += lineTax;

            items.push({
                type: 'product',
                product: product.id,
                qty: item.qty,
                price: unitPrice,
                variantId: variant ? variant.id : (item.selectedVariant?.id || null),
                gstRate: itemGstRate,
                gstAmount: lineTax,
                snapshot: {
                    isCustom: false,
                    productName: product.name,
                    brand: product.brand || null,
                    model: product.phoneModel || null,
                    category: product.category || null,
                    sku: product.sku || null,
                    image: product.image || null,
                    price: unitPrice,
                    gstRate: itemGstRate,
                    gstAmount: lineTax,
                    selectedVariant: variant
                        ? { id: variant.id, name: variant.name, price: variant.price, image: variant.image || null }
                        : (item.selectedVariant || null),
                    color: item.color || product.attributes?.color || null,
                    material: item.material || product.materials?.[0] || null,
                    size: item.size || product.attributes?.size || null,
                    designType: product.attributes?.designType || null,
                    attributes: product.attributes || {}
                }
            });
        }
    }

    const taxPrice = +totalTax.toFixed(2);
    const shippingPrice = itemsPrice > 0
        ? (itemsPrice >= settings.freeShippingThreshold ? 0 : settings.shippingFee)
        : 0;
    const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

    const fingerprint = crypto.createHash('sha256')
        .update(JSON.stringify(items.map((it) => ({
            product: it.product,
            qty: it.qty,
            price: it.price,
            variantId: it.variantId || null,
            materialId: it.type === 'custom' ? (it.designMeta.materialId || null) : null,
            layerCount: it.type === 'custom' ? (it.designMeta.layerCount || 0) : null,
            designId: it.type === 'custom' ? (it.designMeta.designId || null) : null
        }))))
        .digest('hex');

    return {
        items,
        shippingAddress: parseResult.data,
        paymentMethod: paymentMethod.trim(),
        itemsPrice: +itemsPrice.toFixed(2),
        taxPrice,
        shippingPrice,
        totalPrice,
        fingerprint
    };
};

// Decrements stock for each product item, failing atomically if any item lacks stock.
const reserveStock = async (items, transaction) => {
    const failures = [];
    for (const item of items || []) {
        if (item.type === 'custom' || item.product === CUSTOM_PRODUCT_ID) continue;
        const [affected] = await Product.decrement('stock', {
            by: item.qty,
            where: { id: item.product, stock: { [Op.gte]: item.qty } },
            transaction
        });
        if (affected === 0) {
            const product = await Product.findByPk(item.product, { attributes: ['name'], transaction });
            failures.push(product ? product.name : `#${item.product}`);
        }
    }
    if (failures.length > 0) {
        const err = new Error(`Insufficient stock for: ${failures.join(', ')}`);
        err.status = 409;
        throw err;
    }
};

// Restores stock for a reservation (payment failed/expired).
const releaseReservedStock = async (items, transaction) => {
    for (const item of items || []) {
        if (item.type === 'custom' || item.product === CUSTOM_PRODUCT_ID) continue;
        await Product.increment('stock', {
            by: item.qty,
            where: { id: item.product },
            transaction
        });
    }
};

const saveDataUrlsConcurrent = async (urls, concurrency = 3) => {
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
};

// Creates the Order + OrderItems from a validated payload.
// `paidFields` ({isPaid, paidAt, payuPaymentId, paymentResult}) is set for
// gateway-confirmed orders; COD orders pass {}. Returns the created Order.
const materializeOrder = async ({ userId, payload, paidFields = {}, transaction }) => {
    const order = await Order.create({
        UserId: userId,
        shippingAddress: payload.shippingAddress,
        paymentMethod: payload.paymentMethod,
        itemsPrice: payload.itemsPrice,
        taxPrice: payload.taxPrice,
        shippingPrice: payload.shippingPrice,
        totalPrice: payload.totalPrice,
        ...paidFields
    }, { transaction });

    const orderItemData = [];
    for (const item of payload.items || []) {
        if (item.type === 'custom') {
            const dm = item.designMeta || {};
            const rawThumb = dm.thumbnail || dm.bgImage || '';
            const layerUrls = (dm.layers || [])
                .filter((l) => l.type === 'image' && (l.url || l.src || l.originalSrc))
                .map((l) => l.originalSrc || l.src || l.url);
            const explicitUploads = Array.isArray(dm.uploadedImages) ? dm.uploadedImages : [];
            const userUploadedSources = Array.from(new Set([...explicitUploads, ...layerUrls].filter(Boolean)));
            
            const [savedThumb] = rawThumb ? await saveDataUrlsConcurrent([rawThumb]) : [''];
            const savedUploadedImages = userUploadedSources.length > 0
                ? await saveDataUrlsConcurrent(userUploadedSources)
                : [];

            const primaryImage = savedThumb || savedUploadedImages[0] || '';

            orderItemData.push({
                OrderId: order.id,
                ProductId: item.product,
                name: dm.productName || (dm.materialLabel ? `${dm.materialLabel} Custom Phone Case` : 'Custom Phone Case'),
                qty: item.qty,
                image: primaryImage,
                price: item.price,
                productSnapshot: {
                    isCustom: true,
                    productName: dm.productName || (dm.materialLabel ? `${dm.materialLabel} Custom Phone Case` : 'Custom Phone Case'),
                    brand: dm.brand || null,
                    model: dm.model || dm.modelLabel || dm.modelId || null,
                    material: dm.materialLabel || dm.material || null,
                    materialId: dm.materialId || null,
                    designPreview: savedThumb || primaryImage || null,
                    uploadedImages: savedUploadedImages.filter(Boolean),
                    customText: dm.customText || dm.layers?.filter((l) => l.type === 'text').map((l) => l.text).join(', ') || null,
                    customizationNotes: dm.customizationNotes || null,
                    bgColor: dm.bgColor || null,
                    bgImage: dm.bgImage || null,
                    layers: dm.layers || [],
                    layerCount: dm.layerCount || dm.layers?.length || 0,
                    designId: dm.designId || null
                }
            });
            continue;
        }

        orderItemData.push({
            OrderId: order.id,
            ProductId: item.product,
            name: item.snapshot?.productName || 'Product',
            qty: item.qty,
            image: item.snapshot?.image || '',
            price: item.price,
            productSnapshot: item.snapshot || null
        });
    }

    await OrderItem.bulkCreate(orderItemData, { transaction });
    return order;
};

module.exports = {
    buildOrderPayload,
    reserveStock,
    releaseReservedStock,
    materializeOrder,
    CUSTOM_PRODUCT_ID,
    MAX_QTY_PER_ITEM
};
