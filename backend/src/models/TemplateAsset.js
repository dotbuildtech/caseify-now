const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TemplateAsset = sequelize.define('TemplateAsset', {
    studioTemplateId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    editableAreaId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    assetType: {
        type: DataTypes.ENUM('image', 'svg', 'font', 'overlay'),
        allowNull: false,
        defaultValue: 'image'
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    thumbnailUrl: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'TemplateAssets',
    timestamps: true,
    indexes: [
        { fields: ['studioTemplateId'] },
        { fields: ['editableAreaId'] }
    ]
});

module.exports = TemplateAsset;
