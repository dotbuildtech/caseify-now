const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EditableZone = sequelize.define('EditableZone', {
    studioProductId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'Zone'
    },
    zoneType: {
        type: DataTypes.ENUM('image', 'text', 'sticker', 'mixed', 'logo'),
        allowNull: false,
        defaultValue: 'image'
    },
    x: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    y: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    width: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 200
    },
    height: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 200
    },
    rotation: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    minZoom: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.5
    },
    maxZoom: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 3
    },
    allowRotation: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    allowFlip: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    lockAspectRatio: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    placeholderImage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    maxFileSize: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    acceptedFileTypes: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: 'image/jpeg,image/png,image/webp'
    },
    zIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    opacity: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    shape: {
        type: DataTypes.ENUM('rectangle', 'circle', 'rounded-rect'),
        allowNull: false,
        defaultValue: 'rectangle'
    },
    borderRadius: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'EditableZones',
    timestamps: true,
    indexes: [
        { fields: ['studioProductId'] },
        { fields: ['sortOrder'] }
    ]
});

module.exports = EditableZone;
