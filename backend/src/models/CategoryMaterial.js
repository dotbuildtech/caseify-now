const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CategoryMaterial = sequelize.define('CategoryMaterial', {
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
    tableName: 'CategoryMaterials',
    timestamps: true,
    indexes: [
        { fields: ['categoryName'] },
        { fields: ['MaterialId'] },
        { fields: ['categoryName', 'MaterialId'], unique: true }
    ]
});

module.exports = CategoryMaterial;
