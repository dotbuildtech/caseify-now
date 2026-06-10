const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Design = sequelize.define('Design', {
    name: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    artist: {
        type: DataTypes.STRING(200),
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
}, {
    tableName: 'Designs',
    timestamps: true,
    indexes: [
        { fields: ['UserId'] },
        { fields: ['ProductId'] },
        { fields: ['popularity'] }
    ]
});

module.exports = Design;
