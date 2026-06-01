const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Campaign = sequelize.define('Campaign', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: DataTypes.TEXT,
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    discountPercentage: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    targetAudience: {
        type: DataTypes.STRING,
        defaultValue: 'all'
    }
});

module.exports = Campaign;
