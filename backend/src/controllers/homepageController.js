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
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
        res.set('X-Cache', 'HIT');
        return res.json(cache.data);
    }

    const [heroSlides, categories, featuredProducts] = await Promise.all([
        HeroSlide.findAll({
            where: { isActive: true },
            attributes: HERO_ATTRS,
            order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
            raw: true
        }),
        (async () => {
            const allCats = await Category.findAll({
                where: { isActive: true },
                attributes: CAT_ATTRS,
                order: [['name', 'ASC']],
                raw: true
            });
            const products = await Promise.all(
                allCats.map((cat) =>
                    Product.findOne({
                        where: { category: cat.name, isActive: true },
                        attributes: ['image', 'images'],
                        order: [['createdAt', 'DESC']],
                        raw: true
                    })
                )
            );
            return allCats
                .map((cat, i) => {
                    const p = products[i];
                    if (!p) return null;
                    const img = Array.isArray(p.images) && p.images.length
                        ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url)
                        : (p.image || '');
                    return img ? { ...cat, image: img } : null;
                })
                .filter(Boolean);
        })(),
        Product.findAll({
            where: { isFeatured: true, isActive: true },
            attributes: PROD_ATTRS,
            order: [['createdAt', 'DESC']],
            limit: 10,
            raw: true
        })
    ]);

    const data = { heroSlides, categories, featuredProducts };
    cache = { data, timestamp: now };
    res.set('X-Cache', 'MISS');
    res.json(data);
});
