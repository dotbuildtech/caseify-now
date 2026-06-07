const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Expense = sequelize.define('Expense', {
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM(
            'Raw Material',
            'Packaging',
            'Shipping',
            'Marketing',
            'Salaries',
            'Rent',
            'Utilities',
            'Software',
            'Taxes',
            'Other'
        ),
        allowNull: false,
        defaultValue: 'Other'
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
    gstAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('gstAmount');
            return v == null ? null : Number(v);
        }
    },
    totalAmount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        get() {
            const v = this.getDataValue('totalAmount');
            return v == null ? null : Number(v);
        },
        comment: 'amount + gstAmount'
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Cash, Bank Transfer, UPI, Cheque, Card'
    },
    bankAccount: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Which business bank account was used'
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Paid', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Paid'
    },
    expenseDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    receiptNumber: {
        type: DataTypes.STRING(80),
        allowNull: true
    },
    receiptUrl: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    tags: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
    }
}, {
    tableName: 'Expenses',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['category'] },
        { fields: ['status'] },
        { fields: ['expenseDate'] },
        { fields: ['paymentMethod'] }
    ]
});

module.exports = Expense;
