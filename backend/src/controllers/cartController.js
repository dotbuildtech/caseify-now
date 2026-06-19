const { z } = require('zod');
const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { sequelize } = require('../config/db');
const { audit } = require('../utils/securityLog');
const { Cart, CartItem } = require('../models/Cart');
const { saveDataUrl } = require('../utils/saveDataUrl');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

const MAX_QTY = Math.max(1, parseInt(process.env.CART_MAX_QTY_PER_ITEM, 10) || 99);
const MAX_DISTINCT_ITEMS = Math.max(1, parseInt(process.env.CART_MAX_DISTINCT_ITEMS, 10) || 50);
const CART_IDLE_DAYS = Math.max(1, parseInt(process.env.CART_IDLE_DAYS, 10) || 30);

const addItemSchema = z.object({
    productId: z.number().int().positive(),
    productVariantId: z.number().int().positive().optional(),
    quantity: z.number().int().positive().max(MAX_QTY),
    designMeta: z.record(z.any()).optional()
});

const updateItemSchema = z.object({
    quantity: z.number().int().positive().max(MAX_QTY),
    productVariantId: z.number().int().positive().optional()
});

const productIdParamSchema = z.object({
    productId: z.coerce.number().int().positive()
});

const decorateCart = async (cartId) => {
    const cart = await Cart.findByPk(cartId, {
        attributes: ['id', 'UserId', 'lastActivityAt'],
        include: [
            {
                model: CartItem,
                as: 'items',
                attributes: ['id', 'ProductId', 'ProductVariantId', 'quantity', 'priceAtAdd', 'nameAtAdd', 'imageAtAdd', 'variantLabel', 'designMeta', 'createdAt'],
                include: [
                    { model: Product, attributes: ['id', 'name', 'slug', 'image', 'price', 'compareAtPrice', 'category', 'brand', 'phoneModel', 'attributes', 'materials'] },
                    { model: ProductVariant, as: 'variant', attributes: ['id', 'name', 'image', 'price'] }
                ]
            }
        ],
        order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']]
    });
    if (!cart) return null;

    const items = (cart.items || []).map((item) => {
        const json = item.get({ plain: true });
        if (json.designMeta && json.imageAtAdd) {
            json.designMeta.thumbnail = json.imageAtAdd;
        }
        return json;
    });
    const summary = items.reduce(
        (acc, item) => {
            const line = Number(item.priceAtAdd) * item.quantity;
            acc.itemCount += item.quantity;
            acc.subtotal += line;
            return acc;
        },
        { itemCount: 0, subtotal: 0 }
    );

    const taxRate = 0;
    const shipping = 0;
    const tax = +(summary.subtotal * taxRate).toFixed(2);
    const total = +(summary.subtotal + tax + shipping).toFixed(2);

    return {
        id: cart.id,
        UserId: cart.UserId,
        lastActivityAt: cart.lastActivityAt,
        items,
        summary: {
            itemCount: summary.itemCount,
            uniqueItems: items.length,
            subtotal: +summary.subtotal.toFixed(2),
            tax,
            shipping,
            total
        }
    };
};

const getOrCreateCart = async (userId, transaction) => {
    const [cart] = await Cart.findOrCreate({
        where: { UserId: userId },
        defaults: { UserId: userId, lastActivityAt: new Date() },
        transaction
    });
    return cart;
};

exports.getCart = asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user.id);
    await cart.update({ lastActivityAt: new Date() });
    res.json(await decorateCart(cart.id));
});

exports.addItemToCart = asyncHandler(async (req, res) => {
    const { productId, productVariantId, quantity, designMeta } = req.body;

    const result = await sequelize.transaction(async (transaction) => {
        const product = await Product.findByPk(productId, { transaction });

        if (designMeta && !product) {
            const cart = await getOrCreateCart(req.user.id, transaction);

            const { thumbnail: thumb, ...designMetaForDb } = designMeta;
            const hasDesignMeta = Object.keys(designMetaForDb).length > 0;
            const savedThumb = await saveDataUrl(thumb);

            const [cartItem, created] = await CartItem.findOrCreate({
                where: { CartId: cart.id, ProductId: productId, ProductVariantId: null },
                defaults: {
                    CartId: cart.id,
                    ProductId: productId,
                    ProductVariantId: null,
                    quantity,
                    priceAtAdd: designMeta.totalPrice || designMeta.materialPrice || 399,
                    nameAtAdd: `${designMeta.materialLabel || 'Custom'} Phone Case · ${designMeta.modelLabel || ''}`,
                    imageAtAdd: savedThumb,
                    variantLabel: `${designMeta.modelLabel || ''} · ${designMeta.materialLabel || ''}`,
                    designMeta: hasDesignMeta ? designMetaForDb : null
                },
                transaction
            });

            if (!created) {
                const newQty = cartItem.quantity + quantity;
                if (newQty > MAX_QTY) {
                    const err = new Error(`Adding ${quantity} would exceed max of ${MAX_QTY} per item`);
                    err.status = 400;
                    throw err;
                }
                cartItem.quantity = newQty;
                cartItem.priceAtAdd = designMeta.totalPrice || designMeta.materialPrice || 399;
                cartItem.imageAtAdd = savedThumb;
                cartItem.designMeta = hasDesignMeta ? designMetaForDb : null;
                await cartItem.save({ transaction });
            } else {
                const count = await CartItem.count({ where: { CartId: cart.id }, transaction });
                if (count > MAX_DISTINCT_ITEMS) {
                    const err = new Error(`Cart cannot exceed ${MAX_DISTINCT_ITEMS} distinct items`);
                    err.status = 400;
                    throw err;
                }
            }

            await cart.update({ lastActivityAt: new Date() }, { transaction });
            return cart.id;
        }

        if (!product || !product.isActive) {
            const err = new Error('Product not available');
            err.status = 404;
            throw err;
        }

        let variant = null;
        let stock = product.stock;
        let unitPrice = Number(product.price);
        let nameAtAdd = product.name;
        let imageAtAdd = product.image || (Array.isArray(product.images) && product.images[0]) || null;
        let variantLabel = null;

        if (productVariantId) {
            variant = await ProductVariant.findOne({
                where: { id: productVariantId, ProductId: productId },
                transaction
            });
            if (!variant || !variant.isActive) {
                const err = new Error('Variant not available');
                err.status = 404;
                throw err;
            }
            stock = variant.stock;
            unitPrice = variant.price != null ? Number(variant.price) : Number(product.price);
            variantLabel = variant.name;
            imageAtAdd = variant.image || imageAtAdd;
        }

        if (stock < quantity) {
            const err = new Error(`Only ${stock} item(s) in stock`);
            err.status = 400;
            throw err;
        }

        const cart = await getOrCreateCart(req.user.id, transaction);

        const where = { CartId: cart.id, ProductId: productId };
        if (productVariantId) where.ProductVariantId = productVariantId;

            const savedImageAtAdd = await saveDataUrl(imageAtAdd);
            const dm = designMeta ? { ...designMeta } : null;
            if (dm && dm.thumbnail) dm.thumbnail = await saveDataUrl(dm.thumbnail);

            const [cartItem, created] = await CartItem.findOrCreate({
                where,
                defaults: {
                    CartId: cart.id,
                    ProductId: productId,
                    ProductVariantId: productVariantId || null,
                    quantity,
                    priceAtAdd: unitPrice,
                    nameAtAdd,
                    imageAtAdd: savedImageAtAdd,
                    variantLabel,
                    designMeta: dm
                },
                transaction
            });

            if (!created) {
                const newQty = cartItem.quantity + quantity;
            if (newQty > MAX_QTY) {
                const err = new Error(`Adding ${quantity} would exceed max of ${MAX_QTY} per item`);
                err.status = 400;
                throw err;
            }
            if (newQty > stock) {
                const err = new Error(`Only ${stock} item(s) in stock`);
                err.status = 400;
                throw err;
            }
            cartItem.quantity = newQty;
            cartItem.priceAtAdd = unitPrice;
            cartItem.nameAtAdd = nameAtAdd;
            cartItem.imageAtAdd = imageAtAdd;
            cartItem.variantLabel = variantLabel;
            await cartItem.save({ transaction });
        } else {
            const count = await CartItem.count({ where: { CartId: cart.id }, transaction });
            if (count > MAX_DISTINCT_ITEMS) {
                const err = new Error(`Cart cannot exceed ${MAX_DISTINCT_ITEMS} distinct items`);
                err.status = 400;
                throw err;
            }
        }

        await cart.update({ lastActivityAt: new Date() }, { transaction });
        return cart.id;
    });

    res.json(await decorateCart(result));
});

exports.updateCartItemQty = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const productVariantId = req.body.productVariantId || null;

    const cartId = await sequelize.transaction(async (transaction) => {
        const cart = await Cart.findOne({ where: { UserId: req.user.id }, transaction });
        if (!cart) {
            const err = new Error('Cart not found');
            err.status = 404;
            throw err;
        }

        const where = { CartId: cart.id, ProductId: productId };
        if (productVariantId) where.ProductVariantId = productVariantId;

        const cartItem = await CartItem.findOne({ where, transaction });
        if (!cartItem) {
            const err = new Error('Item not in cart');
            err.status = 404;
            throw err;
        }

        const product = await Product.findByPk(productId, { transaction });
        if (!product || !product.isActive) {
            const err = new Error('Product not available');
            err.status = 404;
            throw err;
        }

        let stock = product.stock;
        if (productVariantId && cartItem.ProductVariantId) {
            const variant = await ProductVariant.findByPk(cartItem.ProductVariantId, { transaction });
            if (!variant || !variant.isActive) {
                const err = new Error('Variant not available');
                err.status = 404;
                throw err;
            }
            stock = variant.stock;
        } else if (!cartItem.ProductVariantId && productVariantId) {
            const variant = await ProductVariant.findOne({
                where: { id: productVariantId, ProductId: productId },
                transaction
            });
            if (!variant || !variant.isActive) {
                const err = new Error('Variant not available');
                err.status = 404;
                throw err;
            }
            stock = variant.stock;
            cartItem.ProductVariantId = productVariantId;
        }

        if (quantity > stock) {
            const err = new Error(`Only ${stock} item(s) in stock`);
            err.status = 400;
            throw err;
        }

        cartItem.quantity = quantity;
        await cartItem.save({ transaction });
        await cart.update({ lastActivityAt: new Date() }, { transaction });
        return cart.id;
    });

    res.json(await decorateCart(cartId));
});

exports.removeItemFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const productVariantId = req.query.productVariantId
        ? parseInt(req.query.productVariantId, 10)
        : null;

    const cartId = await sequelize.transaction(async (transaction) => {
        const cart = await Cart.findOne({ where: { UserId: req.user.id }, transaction });
        if (!cart) {
            const err = new Error('Cart not found');
            err.status = 404;
            throw err;
        }

        const where = { CartId: cart.id, ProductId: productId };
        if (productVariantId) where.ProductVariantId = productVariantId;

        const removed = await CartItem.destroy({ where, transaction });
        if (removed === 0) {
            const err = new Error('Item not in cart');
            err.status = 404;
            throw err;
        }
        await cart.update({ lastActivityAt: new Date() }, { transaction });
        return cart.id;
    });

    audit(req, 'cart.remove', `Product:${productId}${productVariantId ? `:variant:${productVariantId}` : ''}`);
    res.json(await decorateCart(cartId));
});

exports.clearCart = asyncHandler(async (req, res) => {
    const result = await sequelize.transaction(async (transaction) => {
        const cart = await Cart.findOne({ where: { UserId: req.user.id }, transaction });
        if (!cart) {
            const err = new Error('Cart not found');
            err.status = 404;
            throw err;
        }
        const removed = await CartItem.destroy({ where: { CartId: cart.id }, transaction });
        await cart.update({ lastActivityAt: new Date() }, { transaction });
        return { cartId: cart.id, removed };
    });
    audit(req, 'cart.clear', null, { removed: result.removed });
    res.json(await decorateCart(result.cartId));
});

exports.getCartItemCount = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ where: { UserId: req.user.id } });
    if (!cart) return res.json({ itemCount: 0, uniqueItems: 0 });
    const result = await CartItem.findOne({
        where: { CartId: cart.id },
        attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('quantity')), 0), 'itemCount'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'uniqueItems']
        ],
        raw: true
    });
    res.json({
        itemCount: Number(result?.itemCount || 0),
        uniqueItems: Number(result?.uniqueItems || 0)
    });
});

exports.cleanupAbandonedCarts = asyncHandler(async (req, res) => {
    const cutoff = new Date(Date.now() - CART_IDLE_DAYS * 24 * 60 * 60 * 1000);
    const carts = await Cart.findAll({ where: { lastActivityAt: { [Op.lt]: cutoff } }, limit: 500 });
    const ids = carts.map((c) => c.id);
    if (ids.length === 0) return res.json({ count: 0, message: 'No abandoned carts' });
    await sequelize.transaction(async (transaction) => {
        await CartItem.destroy({ where: { CartId: { [Op.in]: ids } }, transaction });
        await Cart.destroy({ where: { id: { [Op.in]: ids } }, transaction });
    });
    audit(req, 'cart.cleanup', null, { count: ids.length });
    res.json({ count: ids.length, message: `Cleaned ${ids.length} abandoned cart(s)` });
});

exports.cartSchemas = {
    addItem: addItemSchema,
    updateItem: updateItemSchema,
    productIdParam: productIdParamSchema
};
