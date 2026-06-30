const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../services/prismaClient');

// GET /api/admin/brands
router.get('/', protect, admin, asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || '';
    const activeFilter = req.query.isActive;

    const where = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (activeFilter === 'true') where.isActive = true;
    else if (activeFilter === 'false') where.isActive = false;

    const [brands, total] = await Promise.all([
        prisma.brand.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
        prisma.brand.count({ where })
    ]);

    res.json({ success: true, data: brands, total, page, totalPages: Math.ceil(total / limit) });
}));

// GET /api/admin/brands/:id
router.get('/:id', protect, admin, asyncHandler(async (req, res) => {
    const brand = await prisma.brand.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });
    res.json({ success: true, data: brand });
}));

// POST /api/admin/brands
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    const { name, slug, logo, description, isActive } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, message: 'Name and slug are required' });
    const brand = await prisma.brand.create({ data: { name, slug, logo, description, isActive: isActive !== false } });
    res.status(201).json({ success: true, data: brand });
}));

// PUT /api/admin/brands/:id
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Brand not found' });
    const { name, slug, logo, description, isActive } = req.body;
    const brand = await prisma.brand.update({ where: { id }, data: { name, slug, logo, description, isActive } });
    res.json({ success: true, data: brand });
}));

// DELETE /api/admin/brands/:id
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const modelCount = await prisma.deviceModel.count({ where: { BrandId: id } });
    if (modelCount > 0) return res.status(400).json({ success: false, message: `Cannot delete brand with ${modelCount} associated model(s). Remove models first.` });
    await prisma.brand.delete({ where: { id } });
    res.json({ success: true, message: 'Brand deleted' });
}));

module.exports = router;
