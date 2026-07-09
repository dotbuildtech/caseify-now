const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EditableArea = sequelize.define('EditableArea', {
    studioTemplateId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'Editable Area'
    },
    areaType: {
        type: DataTypes.ENUM('image', 'text', 'logo', 'qr_code', 'sticker', 'mixed'),
        allowNull: false,
        defaultValue: 'image'
    },
    shapeType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'rectangle'
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
        defaultValue: 500
    },
    height: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 500
    },
    rotation: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    minZoom: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0.1
    },
    maxZoom: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 5
    },
    allowRotation: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    allowFlip: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    lockAspectRatio: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isVisible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    placeholderImage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    maxUploadSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 5242880
    },
    acceptedFileTypes: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: 'image/jpeg,image/png,image/webp'
    },
    zIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    opacity: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1
    },
    borderRadius: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    borderRadiusTop: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    borderRadiusBottom: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    polygonSides: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 3
    },
    pathData: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    backgroundColor: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: null
    },
    guideText: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'EditableAreas',
    timestamps: true,
    indexes: [
        { fields: ['studioTemplateId'] },
        { fields: ['sortOrder'] }
    ]
});

module.exports = EditableArea;
