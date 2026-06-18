const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HeroSlide = sequelize.define('HeroSlide', {
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true }
    },
    subtitle: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    ctaText: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Shop Now'
    },
    ctaLink: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: '/shop'
    },
    bg: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'HeroSlides',
    timestamps: true,
    indexes: [
        { fields: ['sortOrder'] },
        { fields: ['isActive'] },
        { fields: ['isActive', 'sortOrder', 'createdAt'] }
    ]
});

module.exports = HeroSlide;
