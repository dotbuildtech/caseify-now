const asyncHandler = require('../utils/asyncHandler');
const CategoryMaterial = require('../models/CategoryMaterial');
const Material = require('../models/Material');

exports.listForCategory = asyncHandler(async (req, res) => {
    const { categoryName } = req.params;
    const links = await CategoryMaterial.findAll({
        where: { categoryName, isActive: true },
        include: [{ model: Material, attributes: ['id', 'name', 'slug'] }],
        order: [[Material, 'name', 'ASC']]
    });
    const materials = links.map((l) => l.Material).filter(Boolean);
    res.json({ data: materials });
});

exports.listAll = asyncHandler(async (req, res) => {
    const links = await CategoryMaterial.findAll({
        include: [{ model: Material, attributes: ['id', 'name', 'slug'] }],
        order: [['categoryName', 'ASC'], [Material, 'name', 'ASC']]
    });
    res.json({ data: links });
});

exports.create = asyncHandler(async (req, res) => {
    const { categoryName, MaterialId } = req.body;
    if (!categoryName || !MaterialId) {
        res.status(400); throw new Error('categoryName and MaterialId are required');
    }
    const material = await Material.findByPk(MaterialId);
    if (!material) { res.status(404); throw new Error('Material not found'); }
    const [link] = await CategoryMaterial.findOrCreate({
        where: { categoryName, MaterialId },
        defaults: { categoryName, MaterialId }
    });
    res.status(201).json(link);
});

exports.remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const link = await CategoryMaterial.findByPk(id);
    if (!link) { res.status(404); throw new Error('Link not found'); }
    await link.destroy();
    res.json({ message: 'Material removed from category' });
});

exports.bulkSet = asyncHandler(async (req, res) => {
    const { categoryName, materialIds } = req.body;
    if (!categoryName || !Array.isArray(materialIds)) {
        res.status(400); throw new Error('categoryName and materialIds array required');
    }
    await CategoryMaterial.destroy({ where: { categoryName } });
    if (materialIds.length > 0) {
        await CategoryMaterial.bulkCreate(
            materialIds.map((MaterialId) => ({ categoryName, MaterialId }))
        );
    }
    const links = await CategoryMaterial.findAll({
        where: { categoryName },
        include: [{ model: Material, attributes: ['id', 'name', 'slug'] }]
    });
    res.json({ data: links });
});
