const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subTotal: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('subTotal');
            return v == null ? null : Number(v);
        }
    },
    cgstTotal: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('cgstTotal');
            return v == null ? null : Number(v);
        },
        comment: 'Central GST (intra-state)'
    },
    sgstTotal: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('sgstTotal');
            return v == null ? null : Number(v);
        },
        comment: 'State GST (intra-state)'
    },
    igstTotal: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('igstTotal');
            return v == null ? null : Number(v);
        },
        comment: 'Integrated GST (inter-state)'
    },
    gstTotal: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('gstTotal');
            return v == null ? null : Number(v);
        }
    },
    discountTotal: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('discountTotal');
            return v == null ? null : Number(v);
        }
    },
    shippingTotal: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('shippingTotal');
            return v == null ? null : Number(v);
        }
    },
    grandTotal: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
            const v = this.getDataValue('grandTotal');
            return v == null ? null : Number(v);
        }
    },
    gstDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: '{cgstRate, sgstRate, igstRate, hsnCode, placeOfSupply, supplierGstin}'
    },
    sellerDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: '{name, address, gstin, pan, phone, email, bankDetails}'
    },
    buyerDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: '{name, address, gstin, email, phone}'
    },
    status: {
        type: DataTypes.ENUM('Draft', 'Generated', 'Sent', 'Paid', 'Cancelled', 'Refunded'),
        allowNull: false,
        defaultValue: 'Generated'
    },
    issuedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    dueAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Invoices',
    timestamps: true,
    paranoid: true,
    indexes: [
        { name: 'invoices_number_uq', fields: ['invoiceNumber'], unique: true },
        { fields: ['status'] },
        { fields: ['issuedAt'] },
        { fields: ['OrderId'] },
        { fields: ['UserId'] }
    ]
});

module.exports = Invoice;
