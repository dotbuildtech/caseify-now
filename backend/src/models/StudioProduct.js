const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudioProduct = sequelize.define('StudioProduct', {
    studioBrandId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    studioModelId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 399
    },
    compareAtPrice: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    gstRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 18.00,
        get() {
            const v = this.getDataValue('gstRate');
            return v == null ? 18 : Number(v);
        },
        validate: { min: 0, max: 100 }
    },
    materialId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'StudioProducts',
    timestamps: true,
    indexes: [
        { fields: ['studioBrandId'] },
        { fields: ['studioModelId'] },
        { fields: ['materialId'] },
        { fields: ['isActive'] }
    ]
});

module.exports = StudioProduct;
