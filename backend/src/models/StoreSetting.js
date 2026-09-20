const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StoreSetting = sequelize.define('StoreSetting', {
    key: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'StoreSettings',
    timestamps: true
});

module.exports = StoreSetting;
