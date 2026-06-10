const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Supplier = sequelize.define('Supplier', {
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 200] }
    },
    contactPerson: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: true,
        validate: { isEmail: true }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    gstin: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'GST Identification Number of the supplier'
    },
    pan: {
        type: DataTypes.STRING(15),
        allowNull: true,
        comment: 'PAN of the supplier'
    },
    address: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Full address: {street, city, state, postalCode, country}'
    },
    bankDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Bank: {accountName, accountNumber, ifsc, bankName, branch}'
    },
    category: {
        type: DataTypes.STRING(80),
        allowNull: true,
        comment: 'e.g. Raw Material, Packaging, Logistics, Marketing'
    },
    paymentTerms: {
        type: DataTypes.STRING(80),
        allowNull: true,
        comment: 'e.g. Net 30, Net 60, Advance'
    },
    outstandingBalance: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('outstandingBalance');
            return v == null ? null : Number(v);
        },
        comment: 'Amount we owe to this supplier'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Suppliers',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['name'] },
        { fields: ['gstin'] },
        { fields: ['category'] },
        { fields: ['isActive'] }
    ]
});

module.exports = Supplier;
