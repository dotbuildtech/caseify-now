const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Cart = sequelize.define('Cart', {
    lastActivityAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Carts',
    timestamps: true,
    indexes: [
        { fields: ['UserId'], unique: true }
    ]
});

const CartItem = sequelize.define('CartItem', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 }
    },
    priceAtAdd: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get() {
            const v = this.getDataValue('priceAtAdd');
            return v == null ? null : Number(v);
        },
        validate: { min: 0 }
    },
    nameAtAdd: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    imageAtAdd: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    variantLabel: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    designMeta: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: 'CartItems',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['CartId'] },
        { fields: ['ProductId'] },
        { fields: ['ProductVariantId'] },
        { fields: ['CartId', 'ProductId', 'ProductVariantId'], unique: true },
        { fields: ['createdAt'] }
    ]
});

module.exports = { Cart, CartItem };
