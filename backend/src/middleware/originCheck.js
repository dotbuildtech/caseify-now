const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const originCheck = (req, res, next) => {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    const allowed = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

    if (allowed.length === 0) {
        if (SAFE_METHODS.has(req.method)) {
            return next();
        }
        if (req.app.get('env') !== 'production') {
            return next();
        }
        return res.status(403).json({
            requestId: req.id,
            message: 'Forbidden: CORS not configured'
        });
    }

    if (allowed.includes('*') && process.env.CORS_ALLOW_WILDCARD !== 'true') {
        if (STATE_CHANGING_METHODS.has(req.method)) {
            return res.status(403).json({
                requestId: req.id,
                message: 'Forbidden: wildcard origin not permitted for state-changing requests'
            });
        }
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

    if (STATE_CHANGING_METHODS.has(req.method)) {
        if (isAllowed(origin) || isAllowed(referer)) {
            return next();
        }
        return res.status(403).json({
            requestId: req.id,
            message: 'Forbidden: origin not allowed'
        });
    }

    return next();
};

module.exports = originCheck;
