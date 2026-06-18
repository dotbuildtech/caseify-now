const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const HeroSlide = require('../models/HeroSlide');
const Category = require('../models/Category');
const Product = require('../models/Product');

const HERO_ATTRS = ['title', 'subtitle', 'ctaText', 'ctaLink', 'bg'];
const CAT_ATTRS = ['name', 'slug'];
const PROD_ATTRS = ['id', 'name', 'slug', 'price', 'compareAtPrice', 'images', 'image', 'category', 'isFeatured', 'createdAt'];

let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

exports.getHomepage = asyncHandler(async (req, res) => {
    const start = Date.now();
    const now = start;
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
        res.set('X-Cache', 'HIT');
        return res.json(cache.data);
    }

    const [heroSlides, featuredProducts] = await Promise.all([
        HeroSlide.findAll({
            where: { isActive: true },
            attributes: HERO_ATTRS,
            order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
            raw: true
        }),
        Product.findAll({
            where: { isFeatured: true, isActive: true },
            attributes: PROD_ATTRS,
            order: [['createdAt', 'DESC']],
            limit: 10,
            raw: true
        })
    ]);

    const allCats = await Category.findAll({
        where: { isActive: true },
        attributes: CAT_ATTRS,
        order: [['name', 'ASC']],
        raw: true
    });

    const catImages = allCats.length > 0
        ? await Product.findAll({
            where: { category: { [Op.in]: allCats.map((c) => c.name) }, isActive: true },
            attributes: ['category', 'image', 'images'],
            raw: true,
            order: [['createdAt', 'DESC']]
        })
        : [];

    const latestByCategory = {};
    for (const p of catImages) {
        if (!latestByCategory[p.category]) {
            latestByCategory[p.category] = p;
        }
    }

    const categories = allCats
        .map((cat) => {
            const p = latestByCategory[cat.name];
            if (!p) return null;
            const img = Array.isArray(p.images) && p.images.length
                ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url)
                : (p.image || '');
            return img ? { ...cat, image: img } : null;
        })
        .filter(Boolean);

    const data = { heroSlides, categories, featuredProducts };
    cache = { data, timestamp: now };
    res.set('X-Cache', 'MISS');
    const totalTime = Date.now() - start;
    if (totalTime > 200) {
        console.log(`[homepage] generated in ${totalTime}ms (hero: ${heroSlides.length}, cats: ${categories.length}, featured: ${featuredProducts.length})`);
    }
    res.json(data);
});
