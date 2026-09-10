const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../utils/asyncHandler');
const { Op } = require('sequelize');
const Material = require('../models/Material');
const { computeStudioPrice } = require('../utils/studioPricing');
const StudioBrand = require('../models/StudioBrand');
const StudioModel = require('../models/StudioModel');
const StudioProduct = require('../models/StudioProduct');
const Brand = require('../models/Brand');
const DeviceModel = require('../models/DeviceModel');
const CustomDesign = require('../models/CustomDesign');

const studioLimiter = rateLimit({
    windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false
});
const priceLimiter = rateLimit({
    windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false
});

// GET /api/studio/brands - from StudioBrand if configured, fallback to all active brands
router.get('/brands', studioLimiter, asyncHandler(async (req, res) => {
    let data = [];
    try {
        const studioBrands = await StudioBrand.findAll({
            where: { showOnStudio: true },
            include: [{ model: Brand, attributes: ['id', 'name', 'slug', 'logo'] }],
            order: [['createdAt', 'DESC']]
        });
        if (studioBrands && studioBrands.length > 0) {
            data = studioBrands
                .filter(sb => sb && sb.Brand)
                .map(sb => ({
                    id: String(sb.Brand.id),
                    name: sb.Brand.name,
                    slug: sb.Brand.slug,
                    logo: sb.logo || sb.Brand.logo
                }));
        }
    } catch (e) {
        console.warn('Failed to query StudioBrand, falling back to Brand table:', e.message);
    }

    if (data.length === 0) {
        const activeBrands = await Brand.findAll({
            where: { isActive: true },
            order: [['name', 'ASC']]
        });
        data = activeBrands.map(b => ({
            id: String(b.id),
            name: b.name,
            slug: b.slug,
            logo: b.logo
        }));
    }
    res.json({ success: true, data });
}));

// GET /api/studio/models?brand=Apple
router.get('/models', studioLimiter, asyncHandler(async (req, res) => {
    const { brand } = req.query;
    if (!brand) return res.json({ success: true, data: [] });
    
    const brandRecord = await Brand.findOne({
        where: {
            [Op.or]: [
                { name: { [Op.iLike]: brand } },
                { slug: { [Op.iLike]: brand } },
                ...(isNaN(Number(brand)) ? [] : [{ id: Number(brand) }])
            ],
            isActive: true
        }
    });
    if (!brandRecord) return res.json({ success: true, data: [] });

    // 1. Try StudioModel if configured
    try {
        const studioBrand = await StudioBrand.findOne({
            where: { brandId: brandRecord.id, showOnStudio: true }
        });
        if (studioBrand) {
            const studioModels = await StudioModel.findAll({
                where: { studioBrandId: studioBrand.id, showOnStudio: true },
                order: [['name', 'ASC']]
            });
            if (studioModels && studioModels.length > 0) {
                const data = studioModels.map(m => ({
                    id: m.id,
                    name: m.name,
                    slug: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    image: m.image || null
                }));
                return res.json({ success: true, data });
            }
        }
    } catch (e) {
        console.warn('StudioModel lookup skipped:', e.message);
    }

    // 2. Fallback to DeviceModel
    const models = await DeviceModel.findAll({
        where: { BrandId: brandRecord.id, isActive: true },
        order: [['name', 'ASC']]
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

    try {
        const studioModels = await StudioModel.findAll({
            where: { name: { [Op.iLike]: `%${q}%` }, showOnStudio: true },
            include: [{ model: StudioBrand, where: { showOnStudio: true }, include: [{ model: Brand, attributes: ['name'] }] }],
            limit: 15
        });
        if (studioModels && studioModels.length > 0) {
            const data = studioModels.map(m => ({
                id: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                label: m.name,
                brand: m.StudioBrand?.Brand?.name || '',
                size: ''
            }));
            return res.json({ success: true, data });
        }
    } catch (e) {
        // Fallback to DeviceModel below
    }

    const models = await DeviceModel.findAll({
        where: { name: { [Op.iLike]: `%${q}%` }, isActive: true },
        include: [{ model: Brand, attributes: ['name'] }],
        order: [['name', 'ASC']],
        limit: 15
    });
    res.json({
        success: true,
        data: models.map(m => ({
            id: m.slug,
            label: m.name,
            brand: m.Brand?.name || '',
            size: ''
        }))
    });
}));

// GET /api/studio/templates?modelId=iphone-16-pro
router.get('/templates', studioLimiter, asyncHandler(async (req, res) => {
    const { modelId } = req.query;
    if (!modelId) return res.json({ success: true, data: null });
    
    try {
        const model = await DeviceModel.findOne({
            where: {
                [Op.or]: [
                    { slug: modelId },
                    { name: { [Op.iLike]: modelId } },
                    ...(isNaN(Number(modelId)) ? [] : [{ id: Number(modelId) }])
                ],
                isActive: true
            },
            include: [{ model: Brand, attributes: ['name'] }]
        });
        if (!model) return res.json({ success: true, data: null });
        
        return res.json({
            success: true,
            data: {
                id: model.id,
                brandName: model.Brand?.name || '',
                modelName: model.name,
                modelSlug: model.slug,
                previewImage: model.image || null
            }
        });
    } catch (e) {
        return res.json({ success: true, data: null });
    }
}));

// GET /api/studio/phone-template-legacy?modelId=...
router.get('/phone-template-legacy', studioLimiter, asyncHandler(async (req, res) => {
    const { modelId } = req.query;
    res.json({ success: true, data: null });
}));

// GET /api/studio/phone-template/:modelId
router.get('/phone-template/:modelId', studioLimiter, asyncHandler(async (req, res) => {
    const { modelId } = req.params;
    res.json({ success: true, data: null });
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
    const { base, layerFee, perUnitPrice } = await computeStudioPrice({ materialId, layerCount });
    res.json({ success: true, price: perUnitPrice, base, layerFee, total: perUnitPrice });
}));

// GET /api/studio/products?studioModelId=5
router.get('/products', studioLimiter, asyncHandler(async (req, res) => {
    const { studioModelId } = req.query;
    if (!studioModelId) return res.json({ success: true, data: [] });
    try {
        const products = await StudioProduct.findAll({
            where: { studioModelId, isActive: true },
            include: [
                { model: Material, attributes: ['id', 'name', 'slug', 'price'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: products });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
}));

// GET /api/studio/designs?modelSlug=iphone-16-pro
router.get('/designs', studioLimiter, asyncHandler(async (req, res) => {
    const { modelSlug } = req.query;
    if (!modelSlug) return res.json({ success: true, data: [] });
    const slugified = modelSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
        const designs = await CustomDesign.findAll({
            where: {
                isActive: true,
                [Op.or]: [
                    { modelSlug: { [Op.iLike]: `%${slugified}%` } },
                    { modelSlug: { [Op.iLike]: `%${modelSlug}%` } }
                ]
            },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: designs });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
}));

module.exports = router;
