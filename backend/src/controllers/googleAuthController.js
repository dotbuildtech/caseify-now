const { OAuth2Client } = require('google-auth-library');
const asyncHandler = require('../utils/asyncHandler');
const logSecurityEvent = require('../utils/securityLog');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { issueTokenPair, sanitizeUser, setTokenCookies } = require('./authController');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = asyncHandler(async (req, res) => {
    const { credential } = req.body;

    if (typeof credential !== 'string' || credential.length < 32) {
        res.status(400);
        throw new Error('Invalid Google credential');
    }

    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
    } catch (err) {
        logSecurityEvent('google.verify_failed', { ip: req.ip, error: err.message });
        res.status(401);
        throw new Error('Invalid Google token');
    }

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase().trim();
    const name = payload.name || email?.split('@')[0] || 'User';
    const profileImage = payload.picture || null;

    if (!email) {
        logSecurityEvent('google.no_email', { ip: req.ip });
        res.status(400);
        throw new Error('Google account has no email address');
    }

    let user = await User.findOne({ where: { googleId } });

    if (user) {
        if (profileImage && user.profileImage !== profileImage) {
            user.profileImage = profileImage;
        }
        await user.recordSuccessfulLogin(req.ip);
        const tokens = await issueTokenPair(user, req);
        logSecurityEvent('google.login_success', { userId: user.id, email, ip: req.ip });

        setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
        res.json(sanitizeUser(user));
        return;
    }

    user = await User.findOne({ where: { email } });

    if (user) {
        if (user.googleId && user.googleId !== googleId) {
            res.status(409);
            throw new Error('Email already associated with a different Google account');
        }

        user.googleId = googleId;
        user.authProvider = 'local';
        if (profileImage) user.profileImage = profileImage;
        await user.recordSuccessfulLogin(req.ip);
        const tokens = await issueTokenPair(user, req);
        logSecurityEvent('google.link_success', { userId: user.id, email, ip: req.ip });

        setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
        res.json(sanitizeUser(user));
        return;
    }

    user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google',
        profileImage,
        password: null,
        isVerified: true
    });

    await user.recordSuccessfulLogin(req.ip);
    const tokens = await issueTokenPair(user, req);
    logSecurityEvent('google.register_success', { userId: user.id, email, ip: req.ip });

    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(201).json(sanitizeUser(user));
});

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

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

exports.setPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

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

    if (user.password) {
        res.status(400);
        throw new Error('Password already set. Use change password instead.');
    }

    user.password = newPassword;
    user.authProvider = 'local';
    await user.save();

    await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { userId: user.id, revokedAt: null } }
    );

    const tokens = await issueTokenPair(user, req);
    logSecurityEvent('set_password.success', { userId: user.id, ip: req.ip });

    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ message: 'Password set successfully' });
});
