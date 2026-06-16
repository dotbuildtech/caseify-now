const jwt = require('jsonwebtoken');
const User = require('../models/User');

const extractToken = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    if (req.cookies?.accessToken) {
        return req.cookies.accessToken;
    }
    return null;
};

const protect = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Not authorized, token expired' });
        }
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const admin = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    if (req.user && !req.user.role) {
        const user = await User.findByPk(req.user.id, { attributes: ['role'] });
        if (user && user.role === 'admin') {
            req.user.role = 'admin';
            return next();
        }
    }
    res.status(401).json({ message: 'Not authorized as an admin' });
};

module.exports = { protect, admin };
