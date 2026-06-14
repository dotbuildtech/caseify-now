const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Contact = sequelize.define('Contact', {
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true, len: [2, 150] }
    },
    email: {
        type: DataTypes.STRING(254),
        allowNull: false,
        validate: { isEmail: true, notEmpty: true }
    },
    subject: {
        type: DataTypes.STRING(300),
        allowNull: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    repliedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    replyMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Contacts',
    timestamps: true,
    indexes: [
        { fields: ['isRead'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = Contact;
