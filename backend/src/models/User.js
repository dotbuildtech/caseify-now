const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('customer', 'admin'),
        defaultValue: 'customer'
    },
    otpCode: {
        type: DataTypes.STRING
    },
    otpExpiry: {
        type: DataTypes.DATE
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    resetPasswordToken: {
        type: DataTypes.STRING
    },
    resetPasswordExpiry: {
        type: DataTypes.DATE
    },
    failedLoginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    lockoutUntil: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastLoginIp: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    indexes: [
        { fields: ['email'], unique: true },
        { fields: ['resetPasswordToken'] },
        { fields: ['otpCode'] },
        { fields: ['phone'] }
    ],
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

User.prototype.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

User.prototype.isLocked = function () {
    return this.lockoutUntil && this.lockoutUntil > new Date();
};

User.prototype.recordFailedLogin = async function () {
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    if (this.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        this.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }
    await this.save();
};

User.prototype.recordSuccessfulLogin = async function (ip) {
    this.failedLoginAttempts = 0;
    this.lockoutUntil = null;
    this.lastLoginAt = new Date();
    this.lastLoginIp = ip || null;
    await this.save();
};

User.MAX_FAILED_ATTEMPTS = MAX_FAILED_ATTEMPTS;
User.LOCKOUT_DURATION_MS = LOCKOUT_DURATION_MS;

module.exports = User;
