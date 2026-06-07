const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductVariant = sequelize.define('ProductVariant', {
    sku: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 200] }
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        get() {
            const v = this.getDataValue('price');
            return v == null ? null : Number(v);
        },
        validate: { min: 0 }
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    image: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    attributes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'ProductVariants',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['sku'], unique: true },
        { fields: ['ProductId'] }
    ]
});

module.exports = ProductVariant;

