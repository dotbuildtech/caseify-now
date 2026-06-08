const { DataTypes } = require('sequelize');
const slugify = require('slugify');
const { sequelize } = require('../config/db');

const generateUniqueSlug = async (Model, name) => {
    const base = slugify(name || 'product', { lower: true, strict: true, trim: true }) || 'product';
    let slug = base;
    let suffix = 1;
    while (await Model.findOne({ where: { slug }, paranoid: false })) {
        suffix += 1;
        slug = `${base}-${suffix}`;
    }
    return slug;
};

const Product = sequelize.define('Product', {
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 200] }
    },
    slug: {
        type: DataTypes.STRING(220),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true }
    },
    sku: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('price');
            return v == null ? null : Number(v);
        },
        validate: { min: 0 }
    },
    compareAtPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        get() {
            const v = this.getDataValue('compareAtPrice');
            return v == null ? null : Number(v);
        },
        validate: { min: 0 }
    },
    category: {
        type: DataTypes.STRING(80),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 80] }
    },
    phoneModel: {
        type: DataTypes.STRING(80),
        allowNull: true
    },
    brand: {
        type: DataTypes.STRING(80),
        allowNull: true
    },
    image: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    images: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        validate: {
            isArrayOfStrings(value) {
                if (!Array.isArray(value)) throw new Error('images must be an array');
            }
        }
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    lowStockThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: { min: 0 }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    tags: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
    },
    attributes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
    }
}, {
    tableName: 'Products',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['slug'], unique: true },
        { fields: ['sku'], unique: true },
        { fields: ['category'] },
        { fields: ['isActive'] },
        { fields: ['price'] },
        { fields: ['phoneModel'] }
    ],
    hooks: {
        beforeValidate: async (product) => {
            if (product.name && !product.slug) {
                product.slug = await generateUniqueSlug(Product, product.name);
            }
            if (product.compareAtPrice != null && product.price != null
                && Number(product.compareAtPrice) < Number(product.price)) {
                product.compareAtPrice = null;
            }
        }
    }
});

module.exports = Product;
