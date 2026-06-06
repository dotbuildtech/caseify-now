const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RefreshToken = sequelize.define('RefreshToken', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tokenHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    revokedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    replacedByToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userAgentHash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    indexes: [
        { fields: ['tokenHash'], unique: true },
        { fields: ['userId', 'revokedAt'] },
        { fields: ['expiresAt'] }
    ]
});

const User = require('./User');
RefreshToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });

module.exports = RefreshToken;
