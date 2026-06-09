const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const DeviceModel = require('../models/DeviceModel');
const Brand = require('../models/Brand');

exports.listDeviceModels = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.brandId) where.BrandId = req.query.brandId;
    if (req.query.deviceType) where.deviceType = req.query.deviceType;
    if (req.query.q) {
        where.name = { [Op.iLike]: `%${req.query.q}%` };
    }
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    const models = await DeviceModel.findAll({
        where,
        include: [{ model: Brand, attributes: ['id', 'name', 'slug'] }],
        order: [['name', 'ASC']]
    });
    res.json({ data: models });
});

exports.getDeviceModel = asyncHandler(async (req, res) => {
    const model = await DeviceModel.findByPk(req.params.id, {
        include: [{ model: Brand, attributes: ['id', 'name', 'slug'] }]
    });
    if (!model) { res.status(404); throw new Error('Device model not found'); }
    res.json(model);
});

exports.createDeviceModel = asyncHandler(async (req, res) => {
    const { name, BrandId, deviceType } = req.body;
    if (!BrandId) { res.status(400); throw new Error('BrandId is required'); }
    const brand = await Brand.findByPk(BrandId);
    if (!brand) { res.status(404); throw new Error('Brand not found'); }
    const slug = `${brand.slug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    const model = await DeviceModel.create({ name, slug, BrandId, deviceType: deviceType || 'phone' });
    res.status(201).json(model);
});

exports.updateDeviceModel = asyncHandler(async (req, res) => {
    const model = await DeviceModel.findByPk(req.params.id);
    if (!model) { res.status(404); throw new Error('Device model not found'); }
    const { name, BrandId, deviceType, isActive } = req.body;
    const updates = {};
    if (name !== undefined) {
        updates.name = name;
        const brand = BrandId ? await Brand.findByPk(BrandId) : await Brand.findByPk(model.BrandId);
        const brandSlug = brand ? brand.slug : 'unknown';
        updates.slug = `${brandSlug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    }
    if (BrandId !== undefined) updates.BrandId = BrandId;
    if (deviceType !== undefined) updates.deviceType = deviceType;
    if (isActive !== undefined) updates.isActive = isActive;
    await model.update(updates);
    res.json(model);
});

exports.deleteDeviceModel = asyncHandler(async (req, res) => {
    const model = await DeviceModel.findByPk(req.params.id);
    if (!model) { res.status(404); throw new Error('Device model not found'); }
    await model.destroy({ force: req.query.force === 'true' });
    res.json({ message: 'Device model deleted' });
});
