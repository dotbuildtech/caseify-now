const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const CategoryBrand = require('../models/CategoryBrand');
const Brand = require('../models/Brand');
const { invalidateFilterCache } = require('../utils/cacheManager');

exports.listForCategory = asyncHandler(async (req, res) => {
    const { categoryName } = req.params;
    const links = await CategoryBrand.findAll({
        where: { categoryName, isActive: true },
        include: [{ model: Brand, attributes: ['id', 'name', 'slug', 'logo'] }],
        order: [[Brand, 'name', 'ASC']]
    });
    const brands = links.map((l) => l.Brand).filter(Boolean);
    res.json({ data: brands });
});

exports.listAll = asyncHandler(async (req, res) => {
    const links = await CategoryBrand.findAll({
        include: [{ model: Brand, attributes: ['id', 'name', 'slug'] }],
        order: [['categoryName', 'ASC'], [Brand, 'name', 'ASC']]
    });
    res.json({ data: links });
});

exports.create = asyncHandler(async (req, res) => {
    const { categoryName, BrandId } = req.body;
    if (!categoryName || !BrandId) {
        res.status(400); throw new Error('categoryName and BrandId are required');
    }
    const brand = await Brand.findByPk(BrandId);
    if (!brand) { res.status(404); throw new Error('Brand not found'); }
    const [link, created] = await CategoryBrand.findOrCreate({
        where: { categoryName, BrandId },
        defaults: { categoryName, BrandId }
    });
    if (!created) {
        if (!link.isActive) {
            await link.update({ isActive: true });
            invalidateFilterCache();
            return res.json(link);
        }
        return res.status(200).json(link);
    }
    invalidateFilterCache();
    res.status(201).json(link);
});

exports.remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const link = await CategoryBrand.findByPk(id);
    if (!link) { res.status(404); throw new Error('Link not found'); }
    await link.destroy();
    invalidateFilterCache();
    res.json({ message: 'Brand removed from category' });
});

exports.bulkSet = asyncHandler(async (req, res) => {
    const { categoryName, brandIds } = req.body;
    if (!categoryName || !Array.isArray(brandIds)) {
        res.status(400); throw new Error('categoryName and brandIds array required');
    }
    await CategoryBrand.destroy({ where: { categoryName } });
    if (brandIds.length > 0) {
        await CategoryBrand.bulkCreate(
            brandIds.map((BrandId) => ({ categoryName, BrandId }))
        );
    }
    invalidateFilterCache();
    const links = await CategoryBrand.findAll({
        where: { categoryName },
        include: [{ model: Brand, attributes: ['id', 'name', 'slug'] }]
    });
    res.json({ data: links });
});
