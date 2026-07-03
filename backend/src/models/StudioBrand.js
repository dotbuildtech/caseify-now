const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudioBrand = sequelize.define('StudioBrand', {
    brandId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    logo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    showOnStudio: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'StudioBrands',
    timestamps: true,
    indexes: [
        { fields: ['brandId'], unique: true },
        { fields: ['showOnStudio'] }
    ]
});

module.exports = StudioBrand;
