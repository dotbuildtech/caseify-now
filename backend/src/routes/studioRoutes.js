const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../utils/asyncHandler');
const { Op } = require('sequelize');
const Material = require('../models/Material');
const StudioBrand = require('../models/StudioBrand');
const StudioModel = require('../models/StudioModel');
const StudioProduct = require('../models/StudioProduct');
const Brand = require('../models/Brand');
const prisma = require('../services/prismaClient');

const studioLimiter = rateLimit({
    windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false
});
const priceLimiter = rateLimit({
    windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false
});

// GET /api/studio/brands - from StudioBrand if configured, fallback to all active brands
router.get('/brands', studioLimiter, asyncHandler(async (req, res) => {
    const studioBrands = await StudioBrand.findAll({
        where: { showOnStudio: true },
        include: [{ model: Brand, attributes: ['id', 'name', 'slug', 'logo'] }],
        order: [['createdAt', 'DESC']]
    });
    if (studioBrands.length > 0) {
        const data = studioBrands.map(sb => ({
            id: String(sb.Brand.id),
            name: sb.Brand.name,
            slug: sb.Brand.slug,
            logo: sb.logo || sb.Brand.logo
        }));
        return res.json({ success: true, data });
    }
    const brands = await prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: brands.map(b => ({ id: b.id?.toString(), name: b.name, slug: b.slug, logo: b.logo })) });
}));

// GET /api/studio/models?brand=Apple
router.get('/models', studioLimiter, asyncHandler(async (req, res) => {
    const { brand } = req.query;
    if (!brand) return res.json({ success: true, data: [] });
    const brandRecord = await Brand.findOne({
        where: { name: { [Op.iLike]: brand }, isActive: true }
    });
    if (!brandRecord) return res.json({ success: true, data: [] });
    const studioBrand = await StudioBrand.findOne({
        where: { brandId: brandRecord.id, showOnStudio: true }
    });
    if (studioBrand) {
        const studioModels = await StudioModel.findAll({
            where: { studioBrandId: studioBrand.id, showOnStudio: true },
            order: [['name', 'ASC']]
        });
        if (studioModels.length > 0) {
            const data = studioModels.map(m => ({
                id: m.id,
                name: m.name,
                slug: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                image: m.image || null
            }));
            return res.json({ success: true, data });
        }
    }
    const models = await prisma.deviceModel.findMany({
        where: { BrandId: brandRecord.id, isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
    });
    const data = models.map(m => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        image: m.image || null
    }));
    res.json({ success: true, data });
}));

// GET /api/studio/models/search?q=iphone
router.get('/models/search', studioLimiter, asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });
    const studioModels = await StudioModel.findAll({
        where: { name: { [Op.iLike]: `%${q}%` }, showOnStudio: true },
        include: [{ model: StudioBrand, where: { showOnStudio: true }, include: [{ model: Brand, attributes: ['name'] }] }],
        limit: 15
    });
    if (studioModels.length > 0) {
        const data = studioModels.map(m => ({
            id: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            label: m.name,
            brand: m.StudioBrand?.Brand?.name || '',
            size: ''
        }));
        return res.json({ success: true, data });
    }
    const models = await prisma.deviceModel.findMany({
        where: { name: { contains: q, mode: 'insensitive' }, isActive: true },
        include: { Brands: { select: { name: true } } },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        take: 15
    });
    res.json({
        success: true,
        data: models.map(m => ({ id: m.slug, label: m.name, brand: m.Brands?.name || '', size: '' }))
    });
}));

// GET /api/studio/templates?modelId=iphone-16-pro
router.get('/templates', studioLimiter, asyncHandler(async (req, res) => {
    const { modelId } = req.query;
    if (!modelId) return res.json({ success: true, data: null });
    const model = await prisma.deviceModel.findUnique({
        where: { slug: modelId },
        include: { DeviceTemplate: true, Brands: { select: { name: true } } }
    });
    if (!model || !model.DeviceTemplate) return res.json({ success: true, data: null });
    const t = model.DeviceTemplate;
    res.json({
        success: true,
        data: {
            id: t.id,
            brandName: model.Brands?.name || '',
            modelName: model.name,
            modelSlug: model.slug,
            caseWidth: t.caseWidth,
            caseHeight: t.caseHeight,
            safeZone: { top: t.safeAreaTop, bottom: t.safeAreaBottom, left: t.safeAreaLeft, right: t.safeAreaRight },
            bleedArea: t.bleedArea,
            cornerRadius: t.cornerRadius,
            cameraCutout: { x: t.cameraX, y: t.cameraY, w: t.cameraWidth, h: t.cameraHeight },
            previewImage: t.previewImage,
            svgMask: t.svgMask,
            thumbnail: t.thumbnail,
            basePrice: t.basePrice
        }
    });
}));

// GET /api/studio/materials
router.get('/materials', studioLimiter, asyncHandler(async (req, res) => {
    const materials = await Material.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'slug', 'description', 'price', 'isDefault'],
        order: [['isDefault', 'DESC'], ['name', 'ASC']]
    });
    res.json({
        success: true,
        data: materials.map(m => ({ id: m.slug || String(m.id), label: m.name, price: m.price, description: m.description || '', isDefault: m.isDefault }))
    });
}));

// POST /api/studio/calculate-price
router.post('/calculate-price', priceLimiter, asyncHandler(async (req, res) => {
    const { materialId, layerCount } = req.body;
    const byId = !isNaN(materialId) ? { id: parseInt(materialId) } : null;
    const material = await Material.findOne({
        where: { [Op.or]: [{ slug: materialId }, byId].filter(Boolean) }
    });
    const base = material ? material.price : 399;
    const layerFee = layerCount > 2 ? (layerCount - 2) * 25 : 0;
    res.json({ success: true, price: base + layerFee, base, layerFee, total: base + layerFee });
}));

// GET /api/studio/products?studioModelId=5
router.get('/products', studioLimiter, asyncHandler(async (req, res) => {
    const { studioModelId } = req.query;
    if (!studioModelId) return res.json({ success: true, data: [] });
    const products = await StudioProduct.findAll({
        where: { studioModelId, isActive: true },
        include: [
            { model: Material, attributes: ['id', 'name', 'slug', 'price'] }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: products });
}));

// GET /api/studio/designs?modelSlug=iphone-16-pro
router.get('/designs', studioLimiter, asyncHandler(async (req, res) => {
    const { modelSlug } = req.query;
    if (!modelSlug) return res.json({ success: true, data: [] });
    const slugified = modelSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const designs = await prisma.customDesign.findMany({
        where: {
            isActive: true,
            OR: [
                { modelSlug: { contains: slugified, mode: 'insensitive' } },
                { modelSlug: { contains: modelSlug, mode: 'insensitive' } },
            ]
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: designs });
}));

module.exports = router;
