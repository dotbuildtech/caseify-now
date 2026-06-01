const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Inventory = sequelize.define('Inventory', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    lowStockThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    lastRestocked: {
        type: DataTypes.DATE
    },
    history: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
});

// Association
const Product = require('./Product');
Inventory.belongsTo(Product);
Product.hasOne(Inventory);

module.exports = Inventory;
