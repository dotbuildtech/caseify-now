const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FilterOption = sequelize.define('FilterOption', {
    key: {
        type: DataTypes.STRING(60),
        allowNull: false,
        validate: {
            notEmpty: true,
            isIn: [['protectorType', 'connectorType', 'chargingSpeed', 'cableType', 'cableConnector', 'earphoneType', 'capacity']]
        }
    },
    value: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 120] }
    },
    label: {
        type: DataTypes.STRING(120),
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
    tableName: 'FilterOptions',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['key'] },
        { fields: ['key', 'value'], unique: true },
        { fields: ['key', 'isActive', 'sortOrder'] }
    ]
});

module.exports = FilterOption;
