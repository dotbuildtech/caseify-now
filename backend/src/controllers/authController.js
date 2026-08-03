const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const NodeCache = require('node-cache');
const asyncHandler = require('../utils/asyncHandler');
const logSecurityEvent = require('../utils/securityLog');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const aisensyService = require('../services/aisensyService');
const { sendOTPEmail } = require('../services/emailService');

const otpResetCache = new NodeCache({ checkperiod: 30 });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const OTP_EXPIRY_MINUTES = 10;
const OTP_SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_EXPIRES_DAYS = 7;
const RESET_PASSWORD_EXPIRY_MINUTES = 30;

const isProduction = () => process.env.NODE_ENV === 'production';

const TOKEN_COOKIE_OPTS = {
    httpOnly: true,
    secure: isProduction(),
    // Lax: cookies survive the cross-site top-level navigation PayU performs
    // when it redirects back to /payment/success|failure, while still blocking
    // cross-site POSTs (CSRF) alongside the origin check.
    sameSite: 'Lax',
    path: '/'
};

const setTokenCookies = exports.setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        ...TOKEN_COOKIE_OPTS,
        maxAge: 60 * 60 * 1000
    });
    res.cookie('refreshToken', refreshToken, {
        ...TOKEN_COOKIE_OPTS,
        maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
        path: '/api/auth'
    });
};

const clearTokenCookies = exports.clearTokenCookies = (res) => {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth' });
};

const DUMMY_BCRYPT_HASH = '$2a$10$ctVoolAI1URPzipAZ0GzR.Rl/tl5Hn/2ege.6nGJHSwIVajwvM0eS';

const validatePassword = (password) => {
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
        return `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`;
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
        return 'Password must contain at least one lowercase letter, one uppercase letter, and one digit';
    }
    return null;
};

const validateRegistrationInput = ({ name, email, password, phone }) => {
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
        return 'Name must be between 2 and 100 characters';
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email) || email.length > 254) {
        return 'Please provide a valid email address';
    }
    if (phone !== undefined && phone !== null && phone !== '') {
        if (typeof phone !== 'string' || !PHONE_REGEX.test(phone.replace(/[\s-]/g, ''))) {
            return 'Please provide a valid phone number with country code (e.g. +919876543210)';
        }
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
        return passwordError;
    }
    return null;
};

const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });
};

const generateRefreshTokenValue = () => {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const hashUserAgent = (ua) => {
    if (!ua) return null;
    return crypto.createHash('sha256').update(ua).digest('hex');
};

const issueTokenPair = exports.issueTokenPair = async (user, req) => {
    const accessToken = generateAccessToken(user);
    const refreshTokenValue = generateRefreshTokenValue();
    const tokenHash = hashToken(refreshTokenValue);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    const ua = req?.headers?.['user-agent'] || null;

    await RefreshToken.create({
        tokenHash,
        expiresAt,
        userId: user.id,
        userAgent: ua?.slice(0, 255) || null,
        userAgentHash: hashUserAgent(ua),
        ipAddress: req?.ip || null
    });

    return { accessToken, refreshToken: refreshTokenValue };
};

const sanitizeUser = exports.sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage || null
});

const equalizeTimingWithDummyHash = async (password) => {
    try {
        await bcrypt.compare(String(password || ''), DUMMY_BCRYPT_HASH);
    } catch {
        // ignore
    }
};

exports.registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    const validationError = validateRegistrationInput({ name, email, password, phone });
    if (validationError) {
        res.status(400);
        throw new Error(validationError);
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPhone = phone ? String(phone).replace(/[\s-]/g, '') : null;

    const userExists = await User.findOne({ where: { email: normalizedEmail } });

    if (userExists) {
        await equalizeTimingWithDummyHash(password);
        logSecurityEvent('registration.duplicate', { email: normalizedEmail, ip: req.ip });
        res.status(201).json({
            message: 'If this email is new, a confirmation has been sent'
        });
        return;
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password
    });

    const tokens = await issueTokenPair(user, req);
    logSecurityEvent('registration.success', { userId: user.id, email: normalizedEmail, ip: req.ip });

    if (normalizedPhone) {
        try {
            await aisensyService.sendWelcome(normalizedPhone, user.name);
        } catch (err) {
            logSecurityEvent('welcome.send_failed', { userId: user.id, error: err.message });
        }
    }

    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(201).json(sanitizeUser(user));
});

exports.loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
        res.status(400);
        throw new Error('Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
        await equalizeTimingWithDummyHash(password);
        logSecurityEvent('login.user_not_found', { email: normalizedEmail, ip: req.ip });
        res.status(401);
        throw new Error('Invalid email or password');
    }

    if (user.isLocked()) {
        logSecurityEvent('login.locked', { userId: user.id, email: normalizedEmail, ip: req.ip });
        res.status(423);
        throw new Error('Account temporarily locked. Try again later');
    }

    if (!user.password && user.authProvider === 'google') {
        logSecurityEvent('login.google_only', { userId: user.id, email: normalizedEmail, ip: req.ip });
        res.status(401);
        throw new Error('This account uses Google Sign-In. Please continue with Google.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        await user.recordFailedLogin();
        logSecurityEvent('login.failed', {
            userId: user.id,
            email: normalizedEmail,
            ip: req.ip,
            attempts: user.failedLoginAttempts
        });
        res.status(401);
        throw new Error('Invalid email or password');
    }

    await user.recordSuccessfulLogin(req.ip);
    const tokens = await issueTokenPair(user, req);
    logSecurityEvent('login.success', { userId: user.id, email: normalizedEmail, ip: req.ip });

    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json(sanitizeUser(user));
});

exports.refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (typeof refreshToken !== 'string' || refreshToken.length < 32) {
        clearTokenCookies(res);
        res.status(401);
        throw new Error('Invalid refresh token');
    }

    const incomingUaHash = hashUserAgent(req.headers['user-agent'] || null);
    const tokenHash = hashToken(refreshToken);

    const matched = await RefreshToken.findOne({
        where: { tokenHash, revokedAt: null, expiresAt: { [Op.gt]: new Date() } },
        include: [{ model: User }]
    });

    if (!matched) {
        clearTokenCookies(res);
        logSecurityEvent('refresh.not_found', { ip: req.ip });
        res.status(401);
        throw new Error('Invalid or expired refresh token');
    }

    if (matched.userAgentHash && incomingUaHash && matched.userAgentHash !== incomingUaHash) {
        matched.revokedAt = new Date();
        await matched.save();
        clearTokenCookies(res);
        logSecurityEvent('refresh.ua_mismatch_revoke', { userId: matched.userId, ip: req.ip });
        res.status(401);
        throw new Error('Invalid refresh token');
    }

    const user = matched.User;
    const newRefreshValue = generateRefreshTokenValue();
    const newHash = hashToken(newRefreshValue);

    matched.revokedAt = new Date();
    matched.replacedByToken = newHash;
    await matched.save();

    await RefreshToken.create({
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
        userId: user.id,
        userAgent: req.headers['user-agent']?.slice(0, 255) || null,
        userAgentHash: incomingUaHash,
        ipAddress: req.ip || null
    });

    logSecurityEvent('refresh.success', { userId: user.id, ip: req.ip });

    const newAccessToken = generateAccessToken(user);
    setTokenCookies(res, newAccessToken, newRefreshValue);
    res.json({ message: 'Token refreshed' });
});

exports.logout = asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (typeof refreshToken === 'string' && refreshToken.length >= 32) {
        const tokenHash = hashToken(refreshToken);
        const candidate = await RefreshToken.findOne({
            where: { tokenHash, userId: req.user.id, revokedAt: null }
        });
        if (candidate) {
            candidate.revokedAt = new Date();
            await candidate.save();
        }
    }

    clearTokenCookies(res);
    logSecurityEvent('logout', { userId: req.user.id, ip: req.ip });
    res.status(204).send();
});

exports.logoutAll = asyncHandler(async (req, res) => {
    await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { userId: req.user.id, revokedAt: null } }
    );
    clearTokenCookies(res);
    logSecurityEvent('logout_all', { userId: req.user.id, ip: req.ip });
    res.status(204).send();
});

exports.getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json(sanitizeUser(user));
});

exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || !currentPassword) {
        res.status(400);
        throw new Error('Current password is required');
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
        res.status(400);
        throw new Error(passwordError);
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        logSecurityEvent('change_password.failed', { userId: user.id, ip: req.ip });
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { userId: user.id, revokedAt: null } }
    );

    const tokens = await issueTokenPair(user, req);
    logSecurityEvent('change_password.success', { userId: user.id, ip: req.ip });

    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ message: 'Password changed successfully' });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const genericResponse = { message: 'If an account exists, a reset link has been sent' };

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        return res.json(genericResponse);
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
        await equalizeTimingWithDummyHash(crypto.randomBytes(8).toString('hex'));
        return res.json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpiry = new Date(Date.now() + RESET_PASSWORD_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    if (user.phone) {
        try {
            await aisensyService.sendPasswordReset(user.phone, resetLink, RESET_PASSWORD_EXPIRY_MINUTES);
        } catch (err) {
            logSecurityEvent('forgot_password.send_failed', { userId: user.id, error: err.message });
        }
    } else {
        logSecurityEvent('forgot_password.no_phone', { userId: user.id, email: user.email });
    }

    logSecurityEvent('forgot_password.issued', { userId: user.id, ip: req.ip });

    res.json(genericResponse);
});

exports.resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (typeof token !== 'string' || token.length < 32) {
        res.status(400);
        throw new Error('Invalid or expired reset token');
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
        res.status(400);
        throw new Error(passwordError);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        where: {
            resetPasswordToken: tokenHash,
            resetPasswordExpiry: { [Op.gt]: new Date() }
        }
    });

    if (!user) {
        logSecurityEvent('reset_password.invalid_token', { ip: req.ip });
        res.status(400);
        throw new Error('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { userId: user.id, revokedAt: null } }
    );

    logSecurityEvent('reset_password.success', { userId: user.id, ip: req.ip });
    res.json({ message: 'Password reset successfully' });
});

exports.sendOTP = asyncHandler(async (req, res) => {
    const otpCode = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const otpHash = await bcrypt.hash(otpCode, OTP_SALT_ROUNDS);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const user = await User.findByPk(req.user.id);
    user.otpCode = otpHash;
    user.otpExpiry = otpExpiry;
    await user.save();

    if (user.phone) {
        try {
            await aisensyService.sendOtp(user.phone, otpCode, OTP_EXPIRY_MINUTES);
        } catch (err) {
            logSecurityEvent('otp.send_failed', { userId: user.id, error: err.message });
        }
    } else {
        logSecurityEvent('otp.no_phone', { userId: user.id, email: user.email });
    }

    res.json({ message: 'OTP sent successfully' });
});

exports.verifyOTP = asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    const user = await User.findByPk(req.user.id);

    if (!user.otpCode || !user.otpExpiry || user.otpExpiry <= new Date()) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    const isMatch = await bcrypt.compare(code, user.otpCode);
    if (!isMatch) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();
    res.json({ message: 'OTP verified successfully' });
});

const FORGOT_OTP_EXPIRY_MS = 60 * 1000;
const FORGOT_OTP_MAX_REQUESTS = 5;
const FORGOT_OTP_WINDOW_MS = 60 * 60 * 1000;

exports.forgotPasswordOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const genericResponse = { message: 'If an account exists, an OTP has been sent to your email' };

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        return res.json(genericResponse);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
        await equalizeTimingWithDummyHash(crypto.randomBytes(8).toString('hex'));
        return res.json(genericResponse);
    }

    if (user.role === 'admin') {
        return res.json(genericResponse);
    }

    const cacheKey = `forgot_otp_count:${normalizedEmail}`;
    const requestTimestamps = otpResetCache.get(cacheKey) || [];
    const recentRequests = requestTimestamps.filter((t) => Date.now() - t < FORGOT_OTP_WINDOW_MS);

    if (recentRequests.length >= FORGOT_OTP_MAX_REQUESTS) {
        logSecurityEvent('forgot_otp.rate_limited', { email: normalizedEmail, ip: req.ip });
        return res.json(genericResponse);
    }

    const otpCode = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const otpHash = await bcrypt.hash(otpCode, OTP_SALT_ROUNDS);

    user.otpCode = otpHash;
    user.otpExpiry = new Date(Date.now() + FORGOT_OTP_EXPIRY_MS);
    await user.save();

    recentRequests.push(Date.now());
    otpResetCache.set(cacheKey, recentRequests, Math.ceil(FORGOT_OTP_WINDOW_MS / 1000));

    const otpCacheKey = `forgot_otp_verified:${normalizedEmail}`;
    otpResetCache.del(otpCacheKey);

    sendOTPEmail(normalizedEmail, otpCode).catch((err) => {
        logSecurityEvent('forgot_otp.email_failed', { email: normalizedEmail, error: err.message });
        user.otpCode = null;
        user.otpExpiry = null;
        user.save().catch(() => {});
    });

    if (process.env.NODE_ENV !== 'production') {
        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('  DEV MODE — OTP for', normalizedEmail);
        console.log('  ─────────────────────────────────────────');
        console.log('  OTP:', otpCode);
        console.log('  Valid for: 60 seconds');
        console.log('═══════════════════════════════════════════');
        console.log('');
    }

    logSecurityEvent('forgot_otp.sent', { email: normalizedEmail, ip: req.ip });
    res.json(genericResponse);
});

exports.verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        res.status(400);
        throw new Error('Valid email is required');
    }

    if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
        res.status(400);
        throw new Error('Invalid OTP format');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user || user.role === 'admin') {
        await equalizeTimingWithDummyHash(crypto.randomBytes(8).toString('hex'));
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    if (!user.otpCode || !user.otpExpiry || user.otpExpiry <= new Date()) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    const isMatch = await bcrypt.compare(otp, user.otpCode);
    if (!isMatch) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();

    const otpCacheKey = `forgot_otp_verified:${normalizedEmail}`;
    otpResetCache.set(otpCacheKey, true, 300);

    logSecurityEvent('forgot_otp.verified', { email: normalizedEmail, ip: req.ip });
    res.json({ message: 'OTP verified successfully' });
});

exports.resetPasswordWithOTP = asyncHandler(async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        res.status(400);
        throw new Error('Valid email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpCacheKey = `forgot_otp_verified:${normalizedEmail}`;
    const isVerified = otpResetCache.get(otpCacheKey);

    if (!isVerified) {
        res.status(400);
        throw new Error('Please verify OTP first');
    }

    if (typeof newPassword !== 'string' || typeof confirmPassword !== 'string') {
        res.status(400);
        throw new Error('New password and confirm password are required');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('Passwords do not match');
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
        res.status(400);
        throw new Error(passwordError);
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user || user.role === 'admin') {
        res.status(400);
        throw new Error('Something went wrong. Please try again.');
    }

    user.password = newPassword;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { userId: user.id, revokedAt: null } }
    );

    otpResetCache.del(otpCacheKey);
    const countKey = `forgot_otp_count:${normalizedEmail}`;
    otpResetCache.del(countKey);

    logSecurityEvent('reset_password_with_otp.success', { userId: user.id, email: normalizedEmail, ip: req.ip });
    res.json({ message: 'Password reset successfully' });
});

exports.getUsers = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
        attributes: ['id', 'name', 'email', 'role', 'createdAt'],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
    });

    res.json({
        data: rows,
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    });
});
