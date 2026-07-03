const asyncHandler = require('../utils/asyncHandler');
const StudioProduct = require('../models/StudioProduct');
const StudioBrand = require('../models/StudioBrand');
const StudioModel = require('../models/StudioModel');
const Brand = require('../models/Brand');
const Material = require('../models/Material');

exports.listStudioProducts = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.studioBrandId) where.studioBrandId = req.query.studioBrandId;
    if (req.query.studioModelId) where.studioModelId = req.query.studioModelId;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    const products = await StudioProduct.findAll({
        where,
        include: [
            { model: StudioBrand, include: [{ model: Brand, attributes: ['id', 'name', 'slug'] }] },
            { model: StudioModel, attributes: ['id', 'name'] },
            { model: Material, attributes: ['id', 'name', 'slug', 'price'] }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json({ data: products });
});

exports.getStudioProduct = asyncHandler(async (req, res) => {
    const product = await StudioProduct.findByPk(req.params.id, {
        include: [
            { model: StudioBrand, include: [{ model: Brand, attributes: ['id', 'name', 'slug'] }] },
            { model: StudioModel, attributes: ['id', 'name'] },
            { model: Material, attributes: ['id', 'name', 'slug', 'price'] }
        ]
    });
    if (!product) { res.status(404); throw new Error('Studio product not found'); }
    res.json(product);
});

exports.createStudioProduct = asyncHandler(async (req, res) => {
    const { studioBrandId, studioModelId, name, description, image, price, compareAtPrice, materialId, isActive } = req.body;
    if (!studioBrandId) { res.status(400); throw new Error('studioBrandId is required'); }
    if (!studioModelId) { res.status(400); throw new Error('studioModelId is required'); }
    if (!name || !name.trim()) { res.status(400); throw new Error('Name is required'); }
    if (!image) { res.status(400); throw new Error('Image is required'); }
    const studioBrand = await StudioBrand.findByPk(studioBrandId);
    if (!studioBrand) { res.status(404); throw new Error('Studio brand not found'); }
    const studioModel = await StudioModel.findByPk(studioModelId);
    if (!studioModel) { res.status(404); throw new Error('Studio model not found'); }
    const product = await StudioProduct.create({
        studioBrandId,
        studioModelId,
        name: name.trim(),
        description: description || null,
        image,
        price: price || 399,
        compareAtPrice: compareAtPrice || null,
        materialId: materialId || null,
        isActive: isActive !== false
    });
    res.status(201).json(product);
});

exports.updateStudioProduct = asyncHandler(async (req, res) => {
    const product = await StudioProduct.findByPk(req.params.id);
    if (!product) { res.status(404); throw new Error('Studio product not found'); }
    const { name, description, image, price, compareAtPrice, materialId, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (price !== undefined) updates.price = price;
    if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice;
    if (materialId !== undefined) updates.materialId = materialId;
    if (isActive !== undefined) updates.isActive = isActive;
    await product.update(updates);
    res.json(product);
});

exports.deleteStudioProduct = asyncHandler(async (req, res) => {
    const product = await StudioProduct.findByPk(req.params.id);
    if (!product) { res.status(404); throw new Error('Studio product not found'); }
    await product.destroy();
    res.json({ message: 'Studio product deleted' });
});
