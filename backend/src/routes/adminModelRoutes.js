const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../services/prismaClient');

// GET /api/admin/models
router.get('/', protect, admin, asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || '';
    const brandId = req.query.brandId ? parseInt(req.query.brandId) : undefined;
    const activeFilter = req.query.isActive;

    const where = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (brandId) where.BrandId = brandId;
    if (activeFilter === 'true') where.isActive = true;
    else if (activeFilter === 'false') where.isActive = false;

    const [models, total] = await Promise.all([
        prisma.deviceModel.findMany({
            where, skip: (page - 1) * limit, take: limit,
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            include: { Brands: { select: { id: true, name: true, slug: true } } }
        }),
        prisma.deviceModel.count({ where })
    ]);

    res.json({ success: true, data: models, total, page, totalPages: Math.ceil(total / limit) });
}));

// GET /api/admin/models/:id
router.get('/:id', protect, admin, asyncHandler(async (req, res) => {
    const model = await prisma.deviceModel.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { Brands: { select: { id: true, name: true, slug: true } } }
    });
    if (!model) return res.status(404).json({ success: false, message: 'Model not found' });
    res.json({ success: true, data: model });
}));

// POST /api/admin/models
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    const { name, slug, brandId, releaseYear, displayOrder, deviceType, isActive } = req.body;
    if (!name || !slug || !brandId) return res.status(400).json({ success: false, message: 'Name, slug, and brandId are required' });
    const model = await prisma.deviceModel.create({
        data: { name, slug, BrandId: brandId, releaseYear, displayOrder: displayOrder || 0, deviceType: deviceType || 'phone', isActive: isActive !== false }
    });
    res.status(201).json({ success: true, data: model });
}));

// PUT /api/admin/models/:id
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const existing = await prisma.deviceModel.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Model not found' });
    const { name, slug, brandId, releaseYear, displayOrder, deviceType, isActive } = req.body;
    const model = await prisma.deviceModel.update({
        where: { id }, data: { name, slug, BrandId: brandId, releaseYear, displayOrder, deviceType, isActive }
    });
    res.json({ success: true, data: model });
}));

// DELETE /api/admin/models/:id
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const hasTemplate = await prisma.deviceTemplate.findUnique({ where: { deviceModelId: id } });
    if (hasTemplate) return res.status(400).json({ success: false, message: 'Cannot delete model with an associated template. Remove the template first.' });
    await prisma.deviceModel.delete({ where: { id } });
    res.json({ success: true, message: 'Model deleted' });
}));

module.exports = router;
