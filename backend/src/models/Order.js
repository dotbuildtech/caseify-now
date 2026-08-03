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
    itemsPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('itemsPrice');
            return v == null ? null : Number(v);
        },
        validate: { min: 0 }
    },
    taxPrice: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0
    },
    shippingPrice: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0
    },
    totalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.0
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    paidAt: {
        type: DataTypes.DATE
    },
    payuTxnId: {
        type: DataTypes.STRING(40),
        allowNull: true,
        unique: true
    },
    payuPaymentId: {
        type: DataTypes.STRING(100),
        allowNull: true
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
}, {
    indexes: [
        { fields: ['UserId'] },
        { fields: ['orderStatus'] },
        { fields: ['createdAt'] },
        { fields: ['payuTxnId'], unique: true }
    ]
});

const OrderItem = sequelize.define('OrderItem', {
    name: { type: DataTypes.STRING(500), allowNull: false },
    qty: { type: DataTypes.INTEGER, allowNull: false },
    image: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    productSnapshot: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
    }
}, {
    indexes: [
        { fields: ['OrderId'] },
        { fields: ['ProductId'] }
    ]
});

module.exports = { Order, OrderItem };
