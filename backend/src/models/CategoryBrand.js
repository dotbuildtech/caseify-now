const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CategoryBrand = sequelize.define('CategoryBrand', {
    categoryName: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'CategoryBrands',
    timestamps: true,
    indexes: [
        { fields: ['categoryName'] },
        { fields: ['BrandId'] },
        { fields: ['categoryName', 'BrandId'], unique: true }
    ]
});

module.exports = CategoryBrand;
