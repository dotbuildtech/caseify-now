const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    const token = (() => {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            return req.headers.authorization.split(' ')[1];
        }
        return req.cookies?.accessToken || null;
    })();

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch {
            // Ignore invalid tokens - treat as unauthenticated
        }
    }
    next();
};

module.exports = optionalAuth;
