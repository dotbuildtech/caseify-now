const rateLimit = require('express-rate-limit');

const commonOpts = {
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }
};

const authLimiter = rateLimit({
    ...commonOpts,
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many authentication requests from this IP, please try again after 15 minutes'
    }
});

const loginLimiter = rateLimit({
    ...commonOpts,
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes'
    }
});

const registerLimiter = rateLimit({
    ...commonOpts,
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many accounts created from this IP, please try again after an hour'
    }
});

const otpLimiter = rateLimit({
    ...commonOpts,
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Too many OTP requests from this IP, please try again after 15 minutes'
    }
});

const forgotPasswordLimiter = rateLimit({
    ...commonOpts,
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

module.exports = {
    authLimiter,
    loginLimiter,
    registerLimiter,
    otpLimiter,
    forgotPasswordLimiter
};
