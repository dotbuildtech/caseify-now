const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const HeroSlide = require('../models/HeroSlide');
const { sequelize } = require('../config/db');
const { uploadFromBuffer, deleteImage, getPublicIdFromUrl } = require('../services/cloudinaryService');

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
        const result = await uploadFromBuffer(req.file.buffer, 'phone-cover-platform/heroslides');
        data.bg = result.secure_url;
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
        const oldPublicId = getPublicIdFromUrl(slide.bg);
        if (oldPublicId) deleteImage(oldPublicId).catch(() => {});
        const result = await uploadFromBuffer(req.file.buffer, 'phone-cover-platform/heroslides');
        slide.bg = result.secure_url;
    } else if (bg !== undefined) {
        slide.bg = bg || null;
    }

    await slide.save();
    res.json(slide);
});

exports.deleteSlide = asyncHandler(async (req, res) => {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) { res.status(404); throw new Error('Hero slide not found'); }
    const publicId = getPublicIdFromUrl(slide.bg);
    if (publicId) deleteImage(publicId).catch(() => {});
    await slide.destroy({ force: req.query.force === 'true' });
    res.json({ message: 'Hero slide deleted' });
});

exports.reorderSlides = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) { res.status(400); throw new Error('ids must be an array'); }
    await sequelize.transaction(async (transaction) => {
        const cases = ids.map((id, i) => `WHEN ${Number(id)} THEN ${i}`).join(' ');
        await sequelize.query(
            `UPDATE "HeroSlides" SET "sortOrder" = CASE "id" ${cases} ELSE "sortOrder" END WHERE "id" IN (:ids)`,
            { replacements: { ids }, transaction }
        );
    });
    const slides = await HeroSlide.findAll({ order: [['sortOrder', 'ASC']] });
    res.json({ data: slides });
});
