const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Design = sequelize.define('Design', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    artist: {
        type: DataTypes.STRING,
        defaultValue: 'In-house'
    },
    tags: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    popularity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = Design;
