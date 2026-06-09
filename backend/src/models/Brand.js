const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Brand = sequelize.define('Brand', {
    name: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true, len: [1, 80] }
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true }
    },
    logo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'Brands',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['name'], unique: true },
        { fields: ['slug'], unique: true }
    ]
});

module.exports = Brand;
