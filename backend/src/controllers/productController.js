const { z } = require('zod');
const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { audit } = require('../utils/securityLog');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

const ALLOWED_SORT = new Set([
    'createdAt', '-createdAt',
    'updatedAt', '-updatedAt',
    'name', '-name',
    'price', '-price',
    'stock', '-stock'
]);

const variantSchema = z.object({
    name: z.string().min(1).max(200),
    sku: z.string().min(1).max(64).optional(),
    price: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().default(0),
    image: z.string().optional(),
    attributes: z.record(z.any()).default({}),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0)
});

const productCreateSchema = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(220).optional(),
    sku: z.string().min(1).max(64).optional(),
    description: z.string().min(1),
    price: z.number().nonnegative(),
    compareAtPrice: z.number().nonnegative().optional(),
    category: z.string().min(1).max(80),
    phoneModel: z.string().max(80).optional(),
    brand: z.string().max(80).optional(),
    image: z.string().optional(),
    images: z.array(z.string()).default([]),
    stock: z.number().int().nonnegative().default(0),
    lowStockThreshold: z.number().int().nonnegative().default(5),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    tags: z.array(z.string().max(40)).default([]),
    attributes: z.record(z.any()).default({}),
    variants: z.array(variantSchema).optional()
});

const productUpdateSchema = productCreateSchema.partial().extend({
    variants: z.array(variantSchema).optional()
});

const productBulkUpdateSchema = z.object({
    ids: z.array(z.number().int().positive()).min(1),
    updates: productUpdateSchema
});

const productQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sort: z.string().default('-createdAt'),
    q: z.string().trim().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    phoneModel: z.string().optional(),
    priceMin: z.coerce.number().nonnegative().optional(),
    priceMax: z.coerce.number().nonnegative().optional(),
    tags: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    isFeatured: z.coerce.boolean().optional(),
    includeInactive: z.coerce.boolean().default(false),
    includeVariants: z.coerce.boolean().default(false),
    inStock: z.coerce.boolean().optional(),
    material: z.string().optional(),
    device_type: z.string().optional(),
    port_type: z.string().optional(),
    wattage: z.string().optional(),
    capacity: z.string().optional(),
    cable_type: z.string().optional(),
    length: z.string().optional()
});

const buildProductWhere = (q, isAdmin) => {
    const where = {};
    if (!isAdmin && !q.includeInactive) {
        where.isActive = true;
    } else if (q.isActive !== undefined) {
        where.isActive = q.isActive;
    }
    if (q.category) where.category = q.category;
    if (q.brand) where.brand = q.brand;
    if (q.phoneModel) where.phoneModel = q.phoneModel;
    if (q.priceMin != null || q.priceMax != null) {
        where.price = {};
        if (q.priceMin != null) where.price[Op.gte] = q.priceMin;
        if (q.priceMax != null) where.price[Op.lte] = q.priceMax;
    }
    if (q.inStock === true) where.stock = { [Op.gt]: 0 };
    if (q.inStock === false) where.stock = 0;
    if (q.isFeatured !== undefined) where.isFeatured = q.isFeatured;
    if (q.tags) {
        const list = q.tags.split(',').map((t) => t.trim()).filter(Boolean);
        if (list.length) where.tags = { [Op.overlap]: list };
    }
    if (q.q) {
        const term = q.q;
        where[Op.or] = [
            { name: { [Op.iLike]: `%${term}%` } },
            { description: { [Op.iLike]: `%${term}%` } },
            { sku: { [Op.iLike]: `%${term}%` } },
            { tags: { [Op.overlap]: [term] } }
        ];
    }
    const attrFields = ['material', 'device_type', 'port_type', 'wattage', 'capacity', 'cable_type', 'length'];
    for (const field of attrFields) {
        if (q[field]) {
            where.attributes = { ...where.attributes, [field]: q[field] };
        }
    }
    return where;
};

const parseSort = (sort) => {
    if (!ALLOWED_SORT.has(sort)) return [['createdAt', 'DESC']];
    if (sort.startsWith('-')) return [[sort.slice(1), 'DESC']];
    return [[sort, 'ASC']];
};

const isAdmin = (req) => req.user && req.user.role === 'admin';

exports.getProducts = asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const where = buildProductWhere(q, isAdmin(req));
    const order = parseSort(q.sort);
    const offset = (q.page - 1) * q.limit;

    const include = [];
    if (q.includeVariants) {
        include.push({ model: ProductVariant, as: 'variants' });
    }

    const { count, rows } = await Product.findAndCountAll({
        where,
        order,
        limit: q.limit,
        offset,
        include,
        distinct: true
    });

    res.json({
        data: rows,
        pagination: {
            page: q.page,
            limit: q.limit,
            total: count,
            totalPages: Math.max(1, Math.ceil(count / q.limit)),
            hasNext: offset + rows.length < count,
            hasPrev: q.page > 1
        }
    });
});

exports.getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    const where = isNumeric ? { id } : { slug: id };
    if (!isAdmin(req)) where.isActive = true;

    const product = await Product.findOne({
        where,
        include: [{ model: ProductVariant, as: 'variants' }]
    });

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }
    res.json(product);
});

exports.createProduct = asyncHandler(async (req, res) => {
    const data = req.body;
    const { variants, ...productData } = data;
    const product = await Product.create(productData);
    if (Array.isArray(variants) && variants.length) {
        await ProductVariant.bulkCreate(
            variants.map((v) => ({ ...v, ProductId: product.id }))
        );
    }
    audit(req, 'product.create', `Product:${product.id}`, { name: product.name });
    const full = await Product.findByPk(product.id, {
        include: [{ model: ProductVariant, as: 'variants' }]
    });
    res.status(201).json(full);
});

exports.updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const { variants, ...productData } = data;

    const product = await Product.findByPk(id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const before = product.toJSON();
    await product.update(productData);

    if (Array.isArray(variants)) {
        await ProductVariant.destroy({ where: { ProductId: product.id }, force: false });
        if (variants.length) {
            await ProductVariant.bulkCreate(
                variants.map((v) => ({ ...v, ProductId: product.id }))
            );
        }
    }

    audit(req, 'product.update', `Product:${product.id}`, {
        changedFields: Object.keys(productData),
        before: { price: before.price, stock: before.stock, isActive: before.isActive }
    });

    const full = await Product.findByPk(product.id, {
        include: [{ model: ProductVariant, as: 'variants' }]
    });
    res.json(full);
});

exports.deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const force = req.query.force === 'true';
    const product = await Product.findByPk(id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }
    await product.destroy({ force });
    audit(req, force ? 'product.hardDelete' : 'product.softDelete', `Product:${id}`);
    res.json({ message: force ? 'Product permanently deleted' : 'Product archived' });
});

exports.bulkCreateProducts = asyncHandler(async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        res.status(400);
        throw new Error('Body must be a non-empty array of products');
    }
    const created = await Product.bulkCreate(items, { validate: true });
    audit(req, 'product.bulkCreate', null, { count: created.length, ids: created.map((p) => p.id) });
    res.status(201).json({ count: created.length, data: created });
});

exports.bulkUpdateProducts = asyncHandler(async (req, res) => {
    const { ids, updates } = req.body;
    const [count] = await Product.update(updates, { where: { id: { [Op.in]: ids } } });
    const updated = await Product.findAll({ where: { id: { [Op.in]: ids } } });
    audit(req, 'product.bulkUpdate', null, { ids, changedFields: Object.keys(updates) });
    res.json({ count, data: updated });
});

exports.bulkDeleteProducts = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const force = req.query.force === 'true';
    const count = await Product.destroy({ where: { id: { [Op.in]: ids } }, force });
    audit(req, force ? 'product.bulkHardDelete' : 'product.bulkSoftDelete', null, { ids, count });
    res.json({ count, message: `Deleted ${count} product(s)` });
});

exports.addProductImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { url } = req.body;
    try { new URL(url); } catch { res.status(400); throw new Error('url must be a valid URL'); }

    const product = await Product.findByPk(id);
    if (!product) { res.status(404); throw new Error('Product not found'); }

    const images = [...(product.images || []), url];
    await product.update({ images });
    res.json(product);
});

exports.removeProductImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const imageUrl = req.query.url;
    if (!imageUrl) {
        res.status(400);
        throw new Error('url query parameter is required');
    }
    const decoded = decodeURIComponent(String(imageUrl));
    const product = await Product.findByPk(id);
    if (!product) { res.status(404); throw new Error('Product not found'); }

    const images = (product.images || []).filter((u) => u !== decoded);
    await product.update({ images });
    res.json(product);
});

exports.getLowStockProducts = asyncHandler(async (req, res) => {
    const products = await Product.findAll({
        where: {
            isActive: true,
            stock: { [Op.lte]: Product.sequelize.col('lowStockThreshold') }
        },
        order: [['stock', 'ASC']]
    });
    res.json({ count: products.length, data: products });
});

exports.searchProducts = asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const where = buildProductWhere({ ...q, page: 1, limit: 10 }, isAdmin(req));
    const products = await Product.findAll({ where, limit: 10 });
    res.json({ data: products });
});

exports.productSchemas = {
    list: productQuerySchema,
    create: productCreateSchema,
    update: productUpdateSchema,
    bulkUpdate: productBulkUpdateSchema,
    search: productQuerySchema.pick({ q: true, category: true, brand: true })
};
