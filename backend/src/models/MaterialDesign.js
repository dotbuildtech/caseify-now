const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MaterialDesign = sequelize.define('MaterialDesign', {
    name: { type: DataTypes.STRING(200), allowNull: false },
    imageUrl: { type: DataTypes.STRING(500), allowNull: false },
    materialId: { type: DataTypes.STRING(80), allowNull: false },
    tags: { type: DataTypes.JSONB, defaultValue: [] },
    price: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    designer: { type: DataTypes.STRING(200), defaultValue: 'In-house' },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'MaterialDesigns',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['materialId'] },
        { fields: ['isActive'] },
        { fields: ['sortOrder'] }
    ]
});

module.exports = MaterialDesign;
