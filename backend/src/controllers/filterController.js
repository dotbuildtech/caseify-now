const crypto = require('crypto');
const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const { sequelize } = require('../config/db');
const NodeCache = require('node-cache');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const CategoryBrand = require('../models/CategoryBrand');
const Product = require('../models/Product');
const FilterOption = require('../models/FilterOption');
const DeviceModel = require('../models/DeviceModel');

const CATEGORY_FILTER_MAP = {
    'Mobile Back Covers': { fields: ['brand', 'model'], attrKeys: [] },
    'Screen Protectors': { fields: ['brand', 'model'], attrKeys: ['protectorType'] },
    'Chargers': { fields: [], attrKeys: ['connectorType', 'chargingSpeed'] },
    'Earphones & Earbuds': { fields: [], attrKeys: ['earphoneType'] },
    'Power Banks': { fields: [], attrKeys: ['capacity'] },
    'Cables': { fields: [], attrKeys: ['cableType', 'cableConnector'] },
    'Smart Watches': { fields: ['brand'], attrKeys: [] }
};

const VALID_CATEGORIES = Object.keys(CATEGORY_FILTER_MAP);

const filterCache = new NodeCache({
    stdTTL: 300,
    checkperiod: 60,
    useClones: false
});

const priceCache = new NodeCache({
    stdTTL: 120,
    checkperiod: 30,
    useClones: false
});

const categoryKeysCache = new NodeCache({
    stdTTL: 600,
    checkperiod: 120,
    useClones: false
});

function makeCacheKey(category) {
    return category ? `filters:${category}` : 'filters:all';
}

async function fetchAllCategories() {
    let categories = categoryKeysCache.get('categories');
    if (categories) return categories;
    categories = await Category.findAll({
        where: { isActive: true, name: { [Op.in]: VALID_CATEGORIES } },
        attributes: ['id', 'name', 'slug'],
        order: [['name', 'ASC']],
        raw: true
    });
    categoryKeysCache.set('categories', categories);
    return categories;
}

async function fetchBrandsForCategory(category) {
    const brandLinks = await CategoryBrand.findAll({
        where: { categoryName: category, isActive: true },
        attributes: [],
        include: [{ model: Brand, attributes: ['id', 'name', 'slug', 'logo'], where: { isActive: true } }],
        raw: true,
        nest: true
    });
    return brandLinks
        .map((l) => l.Brand)
        .filter(Boolean);
}

function deduplicateBrands(brands) {
    const seen = new Set();
    const result = [];
    for (const b of brands) {
        if (!seen.has(b.id)) {
            seen.add(b.id);
            result.push(b);
        }
    }
    return result;
}

async function fetchModelsForBrands(brandIds) {
    if (!brandIds || brandIds.length === 0) return [];
    return DeviceModel.findAll({
        where: { BrandId: { [Op.in]: brandIds }, isActive: true },
        attributes: ['id', 'name', 'BrandId'],
        order: [['name', 'ASC']],
        raw: true
    });
}

async function fetchFilterOptionsByKeys(attrKeys) {
    if (!attrKeys || attrKeys.length === 0) return {};
    const options = await FilterOption.findAll({
        where: { key: { [Op.in]: attrKeys }, isActive: true },
        attributes: ['id', 'key', 'value', 'label'],
        order: [['key', 'ASC'], ['sortOrder', 'ASC'], ['value', 'ASC']],
        raw: true
    });
    const grouped = {};
    for (const opt of options) {
        if (!grouped[opt.key]) grouped[opt.key] = [];
        grouped[opt.key].push(opt);
    }
    return grouped;
}

async function fetchPriceRange() {
    const cached = priceCache.get('priceRange');
    if (cached) return cached;

    const result = await Product.findOne({
        where: { isActive: true },
        attributes: [
            [sequelize.fn('MIN', sequelize.col('price')), 'minPrice'],
            [sequelize.fn('MAX', sequelize.col('price')), 'maxPrice']
        ],
        raw: true
    });

    const priceRange = {
        min: result?.minPrice ? Number(result.minPrice) : 0,
        max: result?.maxPrice ? Number(result.maxPrice) : 10000
    };
    priceCache.set('priceRange', priceRange);
    return priceRange;
}

const ETAG_WEAK = true;

function computeEtag(data) {
    const json = JSON.stringify(data);
    const hash = crypto.createHash('sha1').update(json).digest('base64');
    return ETAG_WEAK ? `W/"${hash}"` : `"${hash}"`;
}

exports.getFilters = asyncHandler(async (req, res) => {
    console.time('getFilters:total');

    const categoryParam = req.query.category;
    const selectedCategory = categoryParam ? categoryParam.trim() : null;

    const cacheKey = makeCacheKey(selectedCategory);
    const cached = filterCache.get(cacheKey);
    if (cached) {
        const etag = computeEtag(cached);
        res.set('ETag', etag);
        if (req.headers['if-none-match'] === etag) {
            res.status(304).end();
            console.timeEnd('getFilters:total');
            return;
        }
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
        return res.json({ data: cached });
    }

    const filterConfig = selectedCategory ? CATEGORY_FILTER_MAP[selectedCategory] : null;

    console.time('getFilters:queries');

    const promises = [];

    promises.push(fetchAllCategories());

    if (selectedCategory && filterConfig) {
        promises.push(fetchBrandsForCategory(selectedCategory));
        promises.push(fetchFilterOptionsByKeys(filterConfig.attrKeys));
    } else {
        promises.push(
            Brand.findAll({
                where: { isActive: true },
                attributes: ['id', 'name', 'slug', 'logo'],
                order: [['name', 'ASC']],
                raw: true
            })
        );
        promises.push(Promise.resolve({}));
    }

    promises.push(fetchPriceRange());

    const [categories, brandsOrRaw, filterOptionsOrRaw, priceRange] = await Promise.all(promises);

    console.timeEnd('getFilters:queries');

    let brands = [];
    let models = [];
    let filterOptions = {};

    if (selectedCategory && filterConfig) {
        brands = deduplicateBrands(brandsOrRaw);
        filterOptions = filterOptionsOrRaw;

        if (filterConfig.fields.includes('model')) {
            console.time('getFilters:models');
            const brandIds = brands.map((b) => b.id);
            if (brandIds.length > 0) {
                models = await fetchModelsForBrands(brandIds);
            }
            console.timeEnd('getFilters:models');
        }
    } else {
        brands = brandsOrRaw;
    }

    const sortOptions = [
        { label: 'Newest', value: '-createdAt' },
        { label: 'Price: Low to High', value: 'price' },
        { label: 'Price: High to Low', value: '-price' },
        { label: 'Name: A to Z', value: 'name' },
        { label: 'Name: Z to A', value: '-name' }
    ];

    const responseData = {
        categories,
        brands,
        models,
        filterOptions,
        priceRange,
        sortOptions
    };

    const etag = computeEtag(responseData);
    res.set('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        console.timeEnd('getFilters:total');
        return;
    }

    filterCache.set(cacheKey, responseData);

    console.timeEnd('getFilters:total');
    console.log(`[filters] category=${selectedCategory || 'all'} brands=${brands.length} models=${models.length} attrKeys=${Object.keys(filterOptions).length}`);

    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.json({ data: responseData });
});

exports.invalidateFilterCache = () => {
    filterCache.flushAll();
    priceCache.flushAll();
    categoryKeysCache.flushAll();
    console.log('[filters] Cache flushed');
};

exports.invalidatePriceCache = () => {
    priceCache.flushAll();
};

exports.invalidateCategoryCache = () => {
    categoryKeysCache.flushAll();
};

const { registerInvalidators } = require('../utils/cacheManager');
registerInvalidators({
    invalidateFilterCache: exports.invalidateFilterCache,
    invalidatePriceCache: exports.invalidatePriceCache,
    invalidateCategoryCache: exports.invalidateCategoryCache
});
