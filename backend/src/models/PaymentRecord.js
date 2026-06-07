const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PaymentRecord = sequelize.define('PaymentRecord', {
    transactionId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Internal unique id (e.g. PAY-2026-000001)'
    },
    gateway: {
        type: DataTypes.ENUM('Razorpay', 'Stripe', 'PayPal', 'Bank Transfer', 'UPI', 'Cash on Delivery', 'Other'),
        allowNull: false,
        defaultValue: 'Razorpay'
    },
    gatewayTransactionId: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'External payment gateway id'
    },
    gatewayPaymentId: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    bankAccount: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Which business bank/account received the payment'
    },
    bankName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        get() {
            const v = this.getDataValue('amount');
            return v == null ? null : Number(v);
        },
        validate: { min: 0 }
    },
    currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'INR'
    },
    fee: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('fee');
            return v == null ? null : Number(v);
        },
        comment: 'Gateway/processing fee'
    },
    tax: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('tax');
            return v == null ? null : Number(v);
        }
    },
    netAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        get() {
            const v = this.getDataValue('netAmount');
            return v == null ? null : Number(v);
        },
        comment: 'amount - fee - tax actually received'
    },
    status: {
        type: DataTypes.ENUM('Initiated', 'Authorized', 'Captured', 'Failed', 'Refunded', 'Disputed'),
        allowNull: false,
        defaultValue: 'Captured'
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Card, UPI, NetBanking, Wallet, COD'
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    refundedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    refundAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
        get() {
            const v = this.getDataValue('refundAmount');
            return v == null ? null : Number(v);
        }
    },
    customerEmail: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    customerName: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'PaymentRecords',
    timestamps: true,
    paranoid: true,
    indexes: [
        { name: 'payment_records_txid_uq', fields: ['transactionId'], unique: true },
        { fields: ['paidAt'] },
        { fields: ['status'] },
        { fields: ['gateway'] },
        { fields: ['bankAccount'] }
    ]
});

module.exports = PaymentRecord;
