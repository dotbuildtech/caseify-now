const asyncHandler = require('../utils/asyncHandler');
const EditableZone = require('../models/EditableZone');
const StudioProduct = require('../models/StudioProduct');

exports.listZones = asyncHandler(async (req, res) => {
    const { studioProductId } = req.query;
    const where = {};
    if (studioProductId) where.studioProductId = studioProductId;
    const zones = await EditableZone.findAll({
        where,
        order: [['sortOrder', 'ASC'], ['zIndex', 'ASC']]
    });
    res.json({ data: zones });
});

exports.getZone = asyncHandler(async (req, res) => {
    const zone = await EditableZone.findByPk(req.params.id);
    if (!zone) { res.status(404); throw new Error('Zone not found'); }
    res.json(zone);
});

exports.createZone = asyncHandler(async (req, res) => {
    const { studioProductId, name, zoneType, x, y, width, height, rotation, shape, borderRadius } = req.body;
    if (!studioProductId) { res.status(400); throw new Error('studioProductId is required'); }
    const product = await StudioProduct.findByPk(studioProductId);
    if (!product) { res.status(404); throw new Error('Studio product not found'); }
    const maxOrder = await EditableZone.max('sortOrder', { where: { studioProductId } }) || 0;
    const zone = await EditableZone.create({
        studioProductId,
        name: name || 'Zone',
        zoneType: zoneType || 'image',
        x: x ?? 50,
        y: y ?? 50,
        width: width ?? 200,
        height: height ?? 200,
        rotation: rotation ?? 0,
        shape: shape || 'rectangle',
        borderRadius: borderRadius ?? 0,
        sortOrder: maxOrder + 1
    });
    res.status(201).json(zone);
});

exports.updateZone = asyncHandler(async (req, res) => {
    const zone = await EditableZone.findByPk(req.params.id);
    if (!zone) { res.status(404); throw new Error('Zone not found'); }
    const updatableFields = [
        'name', 'zoneType', 'x', 'y', 'width', 'height', 'rotation',
        'minZoom', 'maxZoom', 'allowRotation', 'allowFlip', 'lockAspectRatio',
        'required', 'visible', 'enabled', 'placeholderImage', 'maxFileSize',
        'acceptedFileTypes', 'zIndex', 'opacity', 'notes', 'shape', 'borderRadius', 'sortOrder'
    ];
    const updates = {};
    for (const field of updatableFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    await zone.update(updates);
    res.json(zone);
});

exports.deleteZone = asyncHandler(async (req, res) => {
    const zone = await EditableZone.findByPk(req.params.id);
    if (!zone) { res.status(404); throw new Error('Zone not found'); }
    await zone.destroy();
    res.json({ message: 'Zone deleted' });
});

exports.reorderZones = asyncHandler(async (req, res) => {
    const { studioProductId, zoneIds } = req.body;
    if (!studioProductId || !Array.isArray(zoneIds)) {
        res.status(400); throw new Error('studioProductId and zoneIds array required');
    }
    for (let i = 0; i < zoneIds.length; i++) {
        await EditableZone.update({ sortOrder: i }, { where: { id: zoneIds[i], studioProductId } });
    }
    res.json({ message: 'Zones reordered' });
});
