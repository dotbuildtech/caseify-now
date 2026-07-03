const asyncHandler = require('../utils/asyncHandler');
const { sequelize } = require('../config/db');
const StudioProduct = require('../models/StudioProduct');
const StudioTemplate = require('../models/StudioTemplate');
const EditableArea = require('../models/EditableArea');
const TemplateAsset = require('../models/TemplateAsset');

exports.createTemplate = asyncHandler(async (req, res) => {
    const { studioProductId, templateImage, originalWidth, originalHeight, editableAreas } = req.body;
    if (!studioProductId) { res.status(400); throw new Error('studioProductId is required'); }
    if (!templateImage) { res.status(400); throw new Error('templateImage is required'); }

    const product = await StudioProduct.findByPk(studioProductId);
    if (!product) { res.status(404); throw new Error('Studio product not found'); }

    const result = await sequelize.transaction(async (t) => {
        const existing = await StudioTemplate.findOne({ where: { studioProductId }, transaction: t });
        if (existing) {
            await EditableArea.destroy({ where: { studioTemplateId: existing.id }, transaction: t });
            await existing.update({
                templateImage,
                originalWidth: originalWidth || 3000,
                originalHeight: originalHeight || 3000
            }, { transaction: t });
            if (editableAreas && editableAreas.length > 0) {
                const areas = editableAreas.map((a, i) => ({
                    ...a,
                    studioTemplateId: existing.id,
                    sortOrder: a.sortOrder ?? i
                }));
                await EditableArea.bulkCreate(areas, { transaction: t });
            }
            return existing.reload({
                include: [{ model: EditableArea, as: 'editableAreas' }],
                transaction: t
            });
        }

        const template = await StudioTemplate.create({
            studioProductId,
            templateImage,
            originalWidth: originalWidth || 3000,
            originalHeight: originalHeight || 3000
        }, { transaction: t });

        if (editableAreas && editableAreas.length > 0) {
            const areas = editableAreas.map((a, i) => ({
                ...a,
                studioTemplateId: template.id,
                sortOrder: a.sortOrder ?? i
            }));
            await EditableArea.bulkCreate(areas, { transaction: t });
        }

        return template.reload({
            include: [{ model: EditableArea, as: 'editableAreas' }],
            transaction: t
        });
    });

    res.status(201).json(result);
});

exports.getTemplate = asyncHandler(async (req, res) => {
    const template = await StudioTemplate.findByPk(req.params.id, {
        include: [
            { model: EditableArea, as: 'editableAreas', order: [['sortOrder', 'ASC']] },
            { model: TemplateAsset, as: 'assets' }
        ]
    });
    if (!template) { res.status(404); throw new Error('Template not found'); }
    res.json(template);
});

exports.getTemplateByProductId = asyncHandler(async (req, res) => {
    const template = await StudioTemplate.findOne({
        where: { studioProductId: req.params.productId },
        include: [
            { model: EditableArea, as: 'editableAreas', order: [['sortOrder', 'ASC']] },
            { model: TemplateAsset, as: 'assets' }
        ]
    });
    if (!template) { res.status(404); throw new Error('Template not found for this product'); }
    res.json(template);
});

exports.updateTemplate = asyncHandler(async (req, res) => {
    const template = await StudioTemplate.findByPk(req.params.id);
    if (!template) { res.status(404); throw new Error('Template not found'); }
    const { templateImage, originalWidth, originalHeight, metadata } = req.body;
    const updates = {};
    if (templateImage !== undefined) updates.templateImage = templateImage;
    if (originalWidth !== undefined) updates.originalWidth = originalWidth;
    if (originalHeight !== undefined) updates.originalHeight = originalHeight;
    if (metadata !== undefined) updates.metadata = metadata;
    await template.update(updates);
    res.json(template);
});

exports.deleteTemplate = asyncHandler(async (req, res) => {
    const template = await StudioTemplate.findByPk(req.params.id);
    if (!template) { res.status(404); throw new Error('Template not found'); }
    await sequelize.transaction(async (t) => {
        await EditableArea.destroy({ where: { studioTemplateId: template.id }, transaction: t });
        await TemplateAsset.destroy({ where: { studioTemplateId: template.id }, transaction: t });
        await template.destroy({ transaction: t });
    });
    res.json({ message: 'Template deleted' });
});

exports.saveFullTemplate = asyncHandler(async (req, res) => {
    const { studioProductId, templateImage, originalWidth, originalHeight, editableAreas, previewImage, thumbnailImage, printImage } = req.body;
    if (!studioProductId) { res.status(400); throw new Error('studioProductId is required'); }

    const product = await StudioProduct.findByPk(studioProductId);
    if (!product) { res.status(404); throw new Error('Studio product not found'); }

    const result = await sequelize.transaction(async (t) => {
        let template = await StudioTemplate.findOne({ where: { studioProductId }, transaction: t });

        if (template) {
            await template.update({
                templateImage: templateImage ?? template.templateImage,
                originalWidth: originalWidth ?? template.originalWidth,
                originalHeight: originalHeight ?? template.originalHeight,
                previewImage: previewImage ?? template.previewImage,
                thumbnailImage: thumbnailImage ?? template.thumbnailImage,
                printImage: printImage ?? template.printImage,
                visibleBounds: req.body.visibleBounds ?? template.visibleBounds
            }, { transaction: t });
            await EditableArea.destroy({ where: { studioTemplateId: template.id }, transaction: t });
        } else {
            template = await StudioTemplate.create({
                studioProductId,
                templateImage,
                originalWidth: originalWidth || 3000,
                originalHeight: originalHeight || 3000,
                previewImage,
                thumbnailImage,
                printImage,
                visibleBounds: req.body.visibleBounds || null
            }, { transaction: t });
        }

        if (editableAreas && editableAreas.length > 0) {
            const areas = editableAreas.map((a, i) => ({
                name: a.name || 'Editable Area',
                areaType: a.areaType || 'image',
                shapeType: a.shapeType || 'rectangle',
                x: a.x ?? 0,
                y: a.y ?? 0,
                width: a.width ?? 500,
                height: a.height ?? 500,
                rotation: a.rotation ?? 0,
                minZoom: a.minZoom,
                maxZoom: a.maxZoom,
                allowRotation: a.allowRotation ?? true,
                allowFlip: a.allowFlip ?? true,
                lockAspectRatio: a.lockAspectRatio ?? false,
                isRequired: a.isRequired ?? false,
                isVisible: a.isVisible ?? true,
                isEnabled: a.isEnabled ?? true,
                placeholderImage: a.placeholderImage || null,
                maxUploadSize: a.maxUploadSize || 5242880,
                acceptedFileTypes: a.acceptedFileTypes || 'image/jpeg,image/png,image/webp',
                borderRadius: a.borderRadius ?? 0,
                borderRadiusTop: a.borderRadiusTop ?? 0,
                borderRadiusBottom: a.borderRadiusBottom ?? 0,
                polygonSides: a.polygonSides ?? null,
                pathData: a.pathData || null,
                zIndex: a.zIndex ?? 0,
                opacity: a.opacity ?? 1,
                notes: a.notes || null,
                sortOrder: a.sortOrder ?? i,
                studioTemplateId: template.id
            }));
            await EditableArea.bulkCreate(areas, { transaction: t });
        }

        return template.reload({
            include: [{ model: EditableArea, as: 'editableAreas', order: [['sortOrder', 'ASC']] }],
            transaction: t
        });
    });

    res.json(result);
});

exports.createEditableArea = asyncHandler(async (req, res) => {
    const { studioTemplateId, name, areaType, shapeType, x, y, width, height, rotation } = req.body;
    if (!studioTemplateId) { res.status(400); throw new Error('studioTemplateId is required'); }

    const template = await StudioTemplate.findByPk(studioTemplateId);
    if (!template) { res.status(404); throw new Error('Template not found'); }

    const maxSort = await EditableArea.max('sortOrder', { where: { studioTemplateId } });
    const area = await EditableArea.create({
        studioTemplateId,
        name: name || 'Editable Area',
        areaType: areaType || 'image',
        shapeType: shapeType || 'rectangle',
        x: x ?? 0,
        y: y ?? 0,
        width: width ?? 500,
        height: height ?? 500,
        rotation: rotation ?? 0,
        borderRadius: req.body.borderRadius ?? 0,
        borderRadiusTop: req.body.borderRadiusTop ?? 0,
        borderRadiusBottom: req.body.borderRadiusBottom ?? 0,
        polygonSides: req.body.polygonSides ?? null,
        pathData: req.body.pathData || null,
        sortOrder: (maxSort ?? -1) + 1
    });
    res.status(201).json(area);
});

exports.updateEditableArea = asyncHandler(async (req, res) => {
    const area = await EditableArea.findByPk(req.params.id);
    if (!area) { res.status(404); throw new Error('Editable area not found'); }
    const allowed = ['name', 'areaType', 'shapeType', 'x', 'y', 'width', 'height', 'rotation',
        'minZoom', 'maxZoom', 'allowRotation', 'allowFlip', 'lockAspectRatio',
        'isRequired', 'isVisible', 'isEnabled', 'placeholderImage',
        'maxUploadSize', 'acceptedFileTypes', 'zIndex', 'opacity', 'notes', 'sortOrder',
        'borderRadius', 'borderRadiusTop', 'borderRadiusBottom', 'polygonSides', 'pathData'];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    await area.update(updates);
    res.json(area);
});

exports.deleteEditableArea = asyncHandler(async (req, res) => {
    const area = await EditableArea.findByPk(req.params.id);
    if (!area) { res.status(404); throw new Error('Editable area not found'); }
    await area.destroy();
    res.json({ message: 'Editable area deleted' });
});

exports.duplicateEditableArea = asyncHandler(async (req, res) => {
    const area = await EditableArea.findByPk(req.params.id);
    if (!area) { res.status(404); throw new Error('Editable area not found'); }
    const maxSort = await EditableArea.max('sortOrder', { where: { studioTemplateId: area.studioTemplateId } });
    const dup = await EditableArea.create({
        ...area.toJSON(),
        id: undefined,
        name: `${area.name} (copy)`,
        sortOrder: (maxSort ?? 0) + 1,
        createdAt: undefined,
        updatedAt: undefined
    });
    res.status(201).json(dup);
});

exports.reorderAreas = asyncHandler(async (req, res) => {
    const { orders } = req.body;
    if (!Array.isArray(orders)) { res.status(400); throw new Error('orders must be an array of {id, sortOrder}'); }
    await sequelize.transaction(async (t) => {
        for (const { id, sortOrder } of orders) {
            await EditableArea.update({ sortOrder }, { where: { id }, transaction: t });
        }
    });
    res.json({ message: 'Reordered' });
});

exports.listEditableAreas = asyncHandler(async (req, res) => {
    const templateId = req.query.templateId;
    const where = templateId ? { studioTemplateId: templateId } : {};
    const areas = await EditableArea.findAll({
        where,
        order: [['sortOrder', 'ASC']]
    });
    res.json({ data: areas });
});
