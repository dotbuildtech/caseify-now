const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudioTemplate = sequelize.define('StudioTemplate', {
    studioProductId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    templateImage: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    originalWidth: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3000
    },
    originalHeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3000
    },
    previewImage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    thumbnailImage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    printImage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    visibleBounds: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: 'StudioTemplates',
    timestamps: true,
    indexes: [
        { fields: ['studioProductId'] }
    ]
});

module.exports = StudioTemplate;
