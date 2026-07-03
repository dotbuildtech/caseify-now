const asyncHandler = require('../utils/asyncHandler');
const StudioModel = require('../models/StudioModel');
const StudioBrand = require('../models/StudioBrand');

exports.listStudioModels = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.studioBrandId) where.studioBrandId = req.query.studioBrandId;
    const models = await StudioModel.findAll({
        where,
        include: [{ model: StudioBrand, attributes: ['id', 'brandId'] }],
        order: [['createdAt', 'DESC']]
    });
    res.json({ data: models });
});

exports.getStudioModel = asyncHandler(async (req, res) => {
    const model = await StudioModel.findByPk(req.params.id, {
        include: [{ model: StudioBrand, attributes: ['id', 'brandId'] }]
    });
    if (!model) { res.status(404); throw new Error('Studio model not found'); }
    res.json(model);
});

exports.createStudioModel = asyncHandler(async (req, res) => {
    const { studioBrandId, name, image, showOnStudio } = req.body;
    if (!studioBrandId) { res.status(400); throw new Error('studioBrandId is required'); }
    if (!name || !name.trim()) { res.status(400); throw new Error('Name is required'); }
    const studioBrand = await StudioBrand.findByPk(studioBrandId);
    if (!studioBrand) { res.status(404); throw new Error('Studio brand not found'); }
    const model = await StudioModel.create({
        studioBrandId,
        name: name.trim(),
        image: image || null,
        showOnStudio: showOnStudio !== false
    });
    res.status(201).json(model);
});

exports.updateStudioModel = asyncHandler(async (req, res) => {
    const model = await StudioModel.findByPk(req.params.id);
    if (!model) { res.status(404); throw new Error('Studio model not found'); }
    const { name, image, showOnStudio } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (image !== undefined) updates.image = image;
    if (showOnStudio !== undefined) updates.showOnStudio = showOnStudio;
    await model.update(updates);
    res.json(model);
});

exports.deleteStudioModel = asyncHandler(async (req, res) => {
    const model = await StudioModel.findByPk(req.params.id);
    if (!model) { res.status(404); throw new Error('Studio model not found'); }
    await model.destroy();
    res.json({ message: 'Studio model deleted' });
});
