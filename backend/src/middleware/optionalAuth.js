const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch {
            // Ignore invalid tokens - treat as unauthenticated
        }
    }
    next();
};

module.exports = optionalAuth;
