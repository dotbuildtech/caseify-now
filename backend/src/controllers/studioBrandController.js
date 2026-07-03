const asyncHandler = require('../utils/asyncHandler');
const StudioBrand = require('../models/StudioBrand');
const StudioModel = require('../models/StudioModel');
const Brand = require('../models/Brand');

exports.listStudioBrands = asyncHandler(async (req, res) => {
    const studioBrands = await StudioBrand.findAll({
        include: [
            { model: Brand, attributes: ['id', 'name', 'slug'] },
            { model: StudioModel, as: 'models', attributes: ['id', 'name', 'image', 'showOnStudio'] }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json({ data: studioBrands });
});

exports.getStudioBrand = asyncHandler(async (req, res) => {
    const studioBrand = await StudioBrand.findByPk(req.params.id, {
        include: [
            { model: Brand, attributes: ['id', 'name', 'slug'] },
            { model: StudioModel, as: 'models' }
        ]
    });
    if (!studioBrand) { res.status(404); throw new Error('Studio brand not found'); }
    res.json(studioBrand);
});

exports.createStudioBrand = asyncHandler(async (req, res) => {
    const { brandId, logo, showOnStudio } = req.body;
    if (!brandId) { res.status(400); throw new Error('brandId is required'); }
    const brand = await Brand.findByPk(brandId);
    if (!brand) { res.status(404); throw new Error('Brand not found'); }
    const existing = await StudioBrand.findOne({ where: { brandId } });
    if (existing) { res.status(409); throw new Error('Studio brand already exists for this brand'); }
    const studioBrand = await StudioBrand.create({ brandId, logo: logo || null, showOnStudio: showOnStudio !== false });
    res.status(201).json(studioBrand);
});

exports.updateStudioBrand = asyncHandler(async (req, res) => {
    const studioBrand = await StudioBrand.findByPk(req.params.id);
    if (!studioBrand) { res.status(404); throw new Error('Studio brand not found'); }
    const { logo, showOnStudio } = req.body;
    const updates = {};
    if (logo !== undefined) updates.logo = logo;
    if (showOnStudio !== undefined) updates.showOnStudio = showOnStudio;
    await studioBrand.update(updates);
    res.json(studioBrand);
});

exports.deleteStudioBrand = asyncHandler(async (req, res) => {
    const studioBrand = await StudioBrand.findByPk(req.params.id);
    if (!studioBrand) { res.status(404); throw new Error('Studio brand not found'); }
    await StudioModel.destroy({ where: { studioBrandId: studioBrand.id } });
    await studioBrand.destroy();
    res.json({ message: 'Studio brand deleted' });
});
