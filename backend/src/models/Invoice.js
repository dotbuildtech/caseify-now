const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    subTotal: DataTypes.FLOAT,
    gstTotal: DataTypes.FLOAT,
    grandTotal: DataTypes.FLOAT,
    gstDetails: {
        type: DataTypes.JSONB
    },
    status: {
        type: DataTypes.ENUM('Generated', 'Sent', 'Paid', 'Cancelled'),
        defaultValue: 'Generated'
    },
    issuedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

// Associations
const Order = require('./Order').Order;
const User = require('./User');

Invoice.belongsTo(Order);
Order.hasOne(Invoice);

Invoice.belongsTo(User);
User.hasMany(Invoice);

module.exports = Invoice;
