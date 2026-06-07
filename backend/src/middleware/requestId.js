const crypto = require('crypto');

const requestId = (req, res, next) => {
    const incoming = req.headers['x-request-id'];
    const id = (typeof incoming === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(incoming))
        ? incoming
        : crypto.randomUUID();
    req.id = id;
    res.setHeader('X-Request-Id', id);
    next();
};

module.exports = requestId;
