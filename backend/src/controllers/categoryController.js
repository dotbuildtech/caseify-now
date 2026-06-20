const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');
const { invalidateFilterCache, invalidateCategoryCache } = require('../utils/cacheManager');

exports.listCategories = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    if (req.query.q) {
        where.name = { [Op.iLike]: `%${req.query.q}%` };
    }
    const categories = await Category.findAll({ where, order: [['name', 'ASC']] });
    res.json({ data: categories });
});

exports.getCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    if (!category) { res.status(404); throw new Error('Category not found'); }
    res.json(category);
});

exports.getCategoryBySlug = asyncHandler(async (req, res) => {
    const category = await Category.findOne({ where: { slug: req.params.slug } });
    if (!category) { res.status(404); throw new Error('Category not found'); }
    res.json(category);
});

exports.createCategory = asyncHandler(async (req, res) => {
    const { name, description, image } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400);
        throw new Error('Category name is required');
    }
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
    const category = await Category.create({ name: name.trim(), slug, description, image });
    invalidateFilterCache();
    invalidateCategoryCache();
    res.status(201).json(category);
});

exports.updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    if (!category) { res.status(404); throw new Error('Category not found'); }
    const { name, description, image, isActive } = req.body;
    const updates = {};
    if (name !== undefined) {
        updates.name = name.trim();
        updates.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
    }
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (isActive !== undefined) updates.isActive = isActive;
    await category.update(updates);
    invalidateFilterCache();
    invalidateCategoryCache();
    res.json(category);
});

exports.deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    if (!category) { res.status(404); throw new Error('Category not found'); }
    await category.destroy({ force: req.query.force === 'true' });
    invalidateFilterCache();
    invalidateCategoryCache();
    res.json({ message: 'Category deleted' });
});
