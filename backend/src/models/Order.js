const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
    shippingAddress: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false
    },
    paymentResult: {
        type: DataTypes.JSONB
    },
    taxPrice: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    shippingPrice: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    totalPrice: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    paidAt: {
        type: DataTypes.DATE
    },
    isDelivered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    deliveredAt: {
        type: DataTypes.DATE
    },
    orderStatus: {
        type: DataTypes.ENUM('Ordered', 'Processing', 'Shipped', 'Delivered', 'Cancelled'),
        defaultValue: 'Ordered'
    }
});

const OrderItem = sequelize.define('OrderItem', {
    name: { type: DataTypes.STRING, allowNull: false },
    qty: { type: DataTypes.INTEGER, allowNull: false },
    image: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false }
});

// Associations
const User = require('./User');
const Product = require('./Product');

Order.belongsTo(User);
User.hasMany(Order);

Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);

OrderItem.belongsTo(Product);

module.exports = { Order, OrderItem };
