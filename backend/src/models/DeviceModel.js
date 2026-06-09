const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DeviceModel = sequelize.define('DeviceModel', {
    name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 120] }
    },
    slug: {
        type: DataTypes.STRING(140),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true }
    },
    deviceType: {
        type: DataTypes.ENUM('phone', 'smartwatch', 'laptop', 'tablet', 'earbuds'),
        allowNull: false,
        defaultValue: 'phone'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'DeviceModels',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['slug'] },
        { fields: ['BrandId'] },
        { fields: ['deviceType'] }
    ]
});

module.exports = DeviceModel;
