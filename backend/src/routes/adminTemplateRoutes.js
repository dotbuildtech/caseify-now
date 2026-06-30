const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../services/prismaClient');

// GET /api/admin/templates?modelId=xxx
router.get('/', protect, admin, asyncHandler(async (req, res) => {
    const modelId = req.query.modelId ? parseInt(req.query.modelId) : undefined;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const where = modelId ? { deviceModelId: modelId } : {};
    const [templates, total] = await Promise.all([
        prisma.deviceTemplate.findMany({
            where, skip: (page - 1) * limit, take: limit,
            orderBy: { createdAt: 'desc' },
            include: { model: { include: { Brands: { select: { id: true, name: true } } } } }
        }),
        prisma.deviceTemplate.count({ where })
    ]);
    res.json({ success: true, data: templates, total, page, totalPages: Math.ceil(total / limit) });
}));

// GET /api/admin/templates/:id
router.get('/:id', protect, admin, asyncHandler(async (req, res) => {
    const template = await prisma.deviceTemplate.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { model: { include: { Brands: { select: { id: true, name: true } } } } }
    });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
}));

// POST /api/admin/templates
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    const { deviceModelId, caseWidth, caseHeight, safeAreaTop, safeAreaBottom, safeAreaLeft, safeAreaRight, bleedArea, cornerRadius, cameraX, cameraY, cameraWidth, cameraHeight, previewImage, svgMask, thumbnail, basePrice, isActive } = req.body;
    if (!deviceModelId || caseWidth == null || caseHeight == null) {
        return res.status(400).json({ success: false, message: 'deviceModelId, caseWidth, and caseHeight are required' });
    }
    const existing = await prisma.deviceTemplate.findUnique({ where: { deviceModelId } });
    if (existing) return res.status(400).json({ success: false, message: 'A template already exists for this model' });
    const template = await prisma.deviceTemplate.create({
        data: { deviceModelId, caseWidth, caseHeight, safeAreaTop, safeAreaBottom, safeAreaLeft, safeAreaRight, bleedArea: bleedArea || 0, cornerRadius, cameraX, cameraY, cameraWidth, cameraHeight, previewImage, svgMask, thumbnail, basePrice: basePrice || 399, isActive: isActive !== false }
    });
    res.status(201).json({ success: true, data: template });
}));

// PUT /api/admin/templates/:id
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const existing = await prisma.deviceTemplate.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });
    const { caseWidth, caseHeight, safeAreaTop, safeAreaBottom, safeAreaLeft, safeAreaRight, bleedArea, cornerRadius, cameraX, cameraY, cameraWidth, cameraHeight, previewImage, svgMask, thumbnail, basePrice, isActive } = req.body;
    const template = await prisma.deviceTemplate.update({
        where: { id }, data: { caseWidth, caseHeight, safeAreaTop, safeAreaBottom, safeAreaLeft, safeAreaRight, bleedArea, cornerRadius, cameraX, cameraY, cameraWidth, cameraHeight, previewImage, svgMask, thumbnail, basePrice, isActive }
    });
    res.json({ success: true, data: template });
}));

// DELETE /api/admin/templates/:id
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    await prisma.deviceTemplate.delete({ where: { id } });
    res.json({ success: true, message: 'Template deleted' });
}));

// CSV Import
router.post('/import-csv', protect, admin, asyncHandler(async (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ success: false, message: 'No rows provided' });
    let created = 0, skipped = 0, errors = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.Brand || !row.Model) { errors.push(`Row ${i + 1}: missing Brand or Model`); continue; }
        try {
            let brand = await prisma.brand.findFirst({ where: { name: { equals: row.Brand, mode: 'insensitive' } } });
            if (!brand) {
                const slug = row.Brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                brand = await prisma.brand.create({ data: { name: row.Brand, slug, isActive: true } });
            }
            const modelSlug = `${brand.slug}-${row.Model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
            const existing = await prisma.deviceModel.findUnique({ where: { slug: modelSlug } });
            if (existing) { skipped++; continue; }
            await prisma.deviceModel.create({
                data: { name: row.Model, slug: modelSlug, BrandId: brand.id, releaseYear: row.ReleaseYear ? parseInt(row.ReleaseYear) : null, isActive: true }
            });
            created++;
        } catch (err) { errors.push(`Row ${i + 1}: ${err.message}`); }
    }
    res.json({ success: true, created, skipped, errors: errors.length > 0 ? errors : undefined });
}));

module.exports = router;
