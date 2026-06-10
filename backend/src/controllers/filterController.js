const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Material = require('../models/Material');
const CategoryBrand = require('../models/CategoryBrand');
const CategoryMaterial = require('../models/CategoryMaterial');
const Product = require('../models/Product');

exports.getFilters = asyncHandler(async (req, res) => {
    const categories = await Category.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'slug'],
        order: [['name', 'ASC']]
    });

    const categoryParam = req.query.category;
    let categoryNames = [];
    if (categoryParam) {
        categoryNames = categoryParam.split(',').map((c) => c.trim()).filter(Boolean);
    }

    let brands = [];
    let materials = [];

    if (categoryNames.length > 0) {
        const brandLinks = await CategoryBrand.findAll({
            where: { categoryName: { [Op.in]: categoryNames }, isActive: true },
            include: [{ model: Brand, attributes: ['id', 'name', 'slug', 'logo'] }]
        });
        brands = [...new Map(brandLinks.map((l) => l.Brand).filter(Boolean).map((b) => [b.id, b])).values()];

        const matLinks = await CategoryMaterial.findAll({
            where: { categoryName: { [Op.in]: categoryNames }, isActive: true },
            include: [{ model: Material, attributes: ['id', 'name', 'slug'] }]
        });
        materials = [...new Map(matLinks.map((l) => l.Material).filter(Boolean).map((m) => [m.id, m])).values()];
    } else {
        brands = await Brand.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'slug', 'logo'],
            order: [['name', 'ASC']]
        });
        materials = await Material.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'slug'],
            order: [['name', 'ASC']]
        });
    }

    const priceRange = await Product.findOne({
        where: { isActive: true },
        attributes: [
            [sequelize.fn('MIN', sequelize.col('price')), 'minPrice'],
            [sequelize.fn('MAX', sequelize.col('price')), 'maxPrice']
        ],
        raw: true
    });

    const sortOptions = [
        { label: 'Newest', value: '-createdAt' },
        { label: 'Price: Low to High', value: 'price' },
        { label: 'Price: High to Low', value: '-price' },
        { label: 'Name: A to Z', value: 'name' },
        { label: 'Name: Z to A', value: '-name' }
    ];

    res.json({
        data: {
            categories,
            brands,
            materials,
            priceRange: {
                min: priceRange?.minPrice ? Number(priceRange.minPrice) : 0,
                max: priceRange?.maxPrice ? Number(priceRange.maxPrice) : 10000
            },
            sortOptions
        }
    });
});

const { sequelize } = require('../config/db');
