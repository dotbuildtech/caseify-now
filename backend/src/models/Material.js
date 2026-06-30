const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Material = sequelize.define('Material', {
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
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 399,
        validate: { min: 0 }
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'Materials',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['name'], unique: true },
        { fields: ['slug'], unique: true },
        { fields: ['isDefault'] }
    ]
});

module.exports = Material;
