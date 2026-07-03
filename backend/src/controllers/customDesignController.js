const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const CustomDesign = require('../models/CustomDesign');

exports.listCustomDesigns = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.modelSlug) where.modelSlug = req.query.modelSlug;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    const designs = await CustomDesign.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ data: designs });
});

exports.getCustomDesign = asyncHandler(async (req, res) => {
    const design = await CustomDesign.findByPk(req.params.id);
    if (!design) { res.status(404); throw new Error('Custom design not found'); }
    res.json(design);
});

exports.createCustomDesign = asyncHandler(async (req, res) => {
    const { name, description, modelSlug, image, price, compareAtPrice, isActive } = req.body;
    if (!name || !modelSlug || !image) {
        res.status(400);
        throw new Error('Name, modelSlug, and image are required');
    }
    const design = await CustomDesign.create({ name, description, modelSlug, image, price, compareAtPrice, isActive });
    res.status(201).json(design);
});

exports.updateCustomDesign = asyncHandler(async (req, res) => {
    const design = await CustomDesign.findByPk(req.params.id);
    if (!design) { res.status(404); throw new Error('Custom design not found'); }
    const { name, description, modelSlug, image, price, compareAtPrice, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (modelSlug !== undefined) updates.modelSlug = modelSlug;
    if (image !== undefined) updates.image = image;
    if (price !== undefined) updates.price = price;
    if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice;
    if (isActive !== undefined) updates.isActive = isActive;
    await design.update(updates);
    res.json(design);
});

exports.deleteCustomDesign = asyncHandler(async (req, res) => {
    const design = await CustomDesign.findByPk(req.params.id);
    if (!design) { res.status(404); throw new Error('Custom design not found'); }
    if (req.query.force === 'true') {
        await design.destroy({ force: true });
    } else {
        await design.update({ isActive: false });
    }
    res.json({ message: 'Custom design deleted' });
});
