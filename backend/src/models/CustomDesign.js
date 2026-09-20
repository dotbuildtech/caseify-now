const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CustomDesign = sequelize.define('CustomDesign', {
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    modelSlug: {
        type: DataTypes.STRING(140),
        allowNull: false,
        validate: { notEmpty: true }
    },
    image: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
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
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'CustomDesigns',
    timestamps: true,
    indexes: [
        { fields: ['modelSlug'] },
        { fields: ['isActive'] }
    ]
});

module.exports = CustomDesign;
