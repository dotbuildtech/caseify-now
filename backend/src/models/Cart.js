const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Cart = sequelize.define('Cart', {});

const CartItem = sequelize.define('CartItem', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
});

// Associations
const User = require('./User');
const Product = require('./Product');

Cart.belongsTo(User);
User.hasOne(Cart);

Cart.hasMany(CartItem);
CartItem.belongsTo(Cart);

CartItem.belongsTo(Product);

module.exports = { Cart, CartItem };
