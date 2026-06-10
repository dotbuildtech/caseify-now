const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true, len: [1, 120] }
    },
    slug: {
        type: DataTypes.STRING(140),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'Categories',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['name'], unique: true },
        { fields: ['slug'], unique: true }
    ]
});

module.exports = Category;
