const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const Material = require('../models/Material');

exports.listMaterials = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    if (req.query.q) {
        where.name = { [Op.iLike]: `%${req.query.q}%` };
    }
    const materials = await Material.findAll({ where, order: [['name', 'ASC']] });
    res.json({ data: materials });
});

exports.getMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findByPk(req.params.id);
    if (!material) { res.status(404); throw new Error('Material not found'); }
    res.json(material);
});

exports.createMaterial = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name || !name.trim()) { res.status(400); throw new Error('Name is required'); }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'material';
    const material = await Material.create({ name: name.trim(), slug, description });
    res.status(201).json(material);
});

exports.updateMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findByPk(req.params.id);
    if (!material) { res.status(404); throw new Error('Material not found'); }
    const { name, description, isActive } = req.body;
    const updates = {};
    if (name !== undefined) { updates.name = name; updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'material'; }
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;
    await material.update(updates);
    res.json(material);
});

exports.deleteMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findByPk(req.params.id);
    if (!material) { res.status(404); throw new Error('Material not found'); }
    await material.destroy({ force: req.query.force === 'true' });
    res.json({ message: 'Material deleted' });
});
