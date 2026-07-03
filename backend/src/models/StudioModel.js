const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudioModel = sequelize.define('StudioModel', {
    studioBrandId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true }
    },
    image: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    showOnStudio: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'StudioModels',
    timestamps: true,
    indexes: [
        { fields: ['studioBrandId'] },
        { fields: ['showOnStudio'] }
    ]
});

module.exports = StudioModel;
