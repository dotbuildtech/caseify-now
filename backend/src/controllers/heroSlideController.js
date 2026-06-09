const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const HeroSlide = require('../models/HeroSlide');
const path = require('path');
const fs = require('fs');

exports.listSlides = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';
    if (req.query.all === 'true') {
        // admin view - show all
    } else {
        where.isActive = true;
    }
    const slides = await HeroSlide.findAll({
        where,
        order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
    });
    res.json({ data: slides });
});

exports.getSlide = asyncHandler(async (req, res) => {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) { res.status(404); throw new Error('Hero slide not found'); }
    res.json(slide);
});

exports.createSlide = asyncHandler(async (req, res) => {
    const { title, subtitle, ctaText, ctaLink, sortOrder, isActive, bg } = req.body;
    const data = {
        title,
        subtitle: subtitle || null,
        ctaText: ctaText || 'Shop Now',
        ctaLink: ctaLink || '/shop',
        sortOrder: sortOrder != null ? sortOrder : 0,
        isActive: isActive !== undefined ? isActive : true
    };
    if (req.file) {
        data.bg = `/uploads/heroslides/${req.file.filename}`;
    } else if (bg) {
        data.bg = bg;
    }
    const slide = await HeroSlide.create(data);
    res.status(201).json(slide);
});

exports.updateSlide = asyncHandler(async (req, res) => {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) { res.status(404); throw new Error('Hero slide not found'); }

    const { title, subtitle, ctaText, ctaLink, sortOrder, isActive, bg } = req.body;
    if (title !== undefined) slide.title = title;
    if (subtitle !== undefined) slide.subtitle = subtitle;
    if (ctaText !== undefined) slide.ctaText = ctaText;
    if (ctaLink !== undefined) slide.ctaLink = ctaLink;
    if (sortOrder !== undefined) slide.sortOrder = sortOrder;
    if (isActive !== undefined) slide.isActive = isActive;

    if (req.file) {
        const oldPath = slide.bg ? path.join(__dirname, '../../', slide.bg) : null;
        slide.bg = `/uploads/heroslides/${req.file.filename}`;
        if (oldPath && fs.existsSync(oldPath) && oldPath.includes('uploads/heroslides/')) {
            try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
        }
    } else if (bg !== undefined) {
        slide.bg = bg || null;
    }

    await slide.save();
    res.json(slide);
});

exports.deleteSlide = asyncHandler(async (req, res) => {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) { res.status(404); throw new Error('Hero slide not found'); }
    if (slide.bg && slide.bg.includes('/uploads/heroslides/')) {
        const filePath = path.join(__dirname, '../../', slide.bg);
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore */ }
    }
    await slide.destroy({ force: req.query.force === 'true' });
    res.json({ message: 'Hero slide deleted' });
});

exports.reorderSlides = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) { res.status(400); throw new Error('ids must be an array'); }
    for (let i = 0; i < ids.length; i++) {
        await HeroSlide.update({ sortOrder: i }, { where: { id: ids[i] } });
    }
    const slides = await HeroSlide.findAll({ order: [['sortOrder', 'ASC']] });
    res.json({ data: slides });
});
