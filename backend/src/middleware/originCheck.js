const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const originCheck = (req, res, next) => {
    if (!STATE_CHANGING_METHODS.has(req.method)) {
        return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const allowed = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

    if (allowed.length === 0 || allowed.includes('*')) {
        return next();
    }

    const isAllowed = (value) => {
        if (!value) return false;
        try {
            const url = new URL(value);
            return allowed.includes(`${url.protocol}//${url.host}`);
        } catch {
            return false;
        }
    };

    if (isAllowed(origin) || isAllowed(referer)) {
        return next();
    }

    return res.status(403).json({ message: 'Forbidden: origin not allowed' });
};

module.exports = originCheck;
