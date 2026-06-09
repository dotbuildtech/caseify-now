const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const Brand = require('../models/Brand');
const DeviceModel = require('../models/DeviceModel');
const Product = require('../models/Product');

exports.listBrands = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    if (req.query.q) {
        where.name = { [Op.iLike]: `%${req.query.q}%` };
    }
    let brands = await Brand.findAll({ where, order: [['name', 'ASC']] });
    if (req.query.category) {
        const productBrands = await Product.findAll({
            attributes: ['brand'],
            where: { category: req.query.category, brand: { [Op.ne]: null, [Op.ne]: '' } },
            group: ['brand']
        });
        const activeNames = new Set(productBrands.map((p) => p.brand));
        if (activeNames.size > 0) {
            brands = brands.filter((b) => activeNames.has(b.name));
        }
    }
    res.json({ data: brands });
});

exports.getBrand = asyncHandler(async (req, res) => {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) { res.status(404); throw new Error('Brand not found'); }
    res.json(brand);
});

exports.createBrand = asyncHandler(async (req, res) => {
    const { name, logo, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'brand';
    const brand = await Brand.create({ name, slug, logo, description });
    res.status(201).json(brand);
});

exports.updateBrand = asyncHandler(async (req, res) => {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) { res.status(404); throw new Error('Brand not found'); }
    const { name, logo, description, isActive } = req.body;
    const updates = {};
    if (name !== undefined) { updates.name = name; updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'brand'; }
    if (logo !== undefined) updates.logo = logo;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;
    await brand.update(updates);
    res.json(brand);
});

exports.deleteBrand = asyncHandler(async (req, res) => {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) { res.status(404); throw new Error('Brand not found'); }
    await brand.destroy({ force: req.query.force === 'true' });
    res.json({ message: 'Brand deleted' });
});

exports.getBrandModels = asyncHandler(async (req, res) => {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) { res.status(404); throw new Error('Brand not found'); }
    const where = { BrandId: brand.id };
    if (req.query.deviceType) where.deviceType = req.query.deviceType;
    let models = await DeviceModel.findAll({ where, order: [['name', 'ASC']] });
    if (req.query.category) {
        const productModels = await Product.findAll({
            attributes: ['phoneModel'],
            where: {
                category: req.query.category,
                brand: brand.name,
                phoneModel: { [Op.ne]: null, [Op.ne]: '' }
            },
            group: ['phoneModel']
        });
        const activeNames = new Set(productModels.map((p) => p.phoneModel));
        if (activeNames.size > 0) {
            models = models.filter((m) => activeNames.has(m.name));
        }
    }
    res.json({ data: models });
});
