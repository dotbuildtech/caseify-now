const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const originCheck = (req, res, next) => {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    const rawOrigins = [
        ...(process.env.CORS_ORIGIN || '').split(','),
        process.env.FRONTEND_URL || ''
    ]
        .map((o) => o.trim())
        .filter(Boolean);

    const isAllowed = (value) => {
        if (!value) return false;
        try {
            const url = new URL(value);
            const originStr = `${url.protocol}//${url.host}`.toLowerCase().replace(/\/+$/, '');
            if (rawOrigins.length === 0 && req.app.get('env') !== 'production') return true;
            return rawOrigins.some((allowed) => {
                const normA = allowed.toLowerCase().replace(/\/+$/, '');
                if (normA === '*' || normA === originStr) return true;
                if (normA.includes('vercel.app') && originStr.endsWith('.vercel.app')) return true;
                if (normA.startsWith('*.') && originStr.endsWith(normA.slice(1))) return true;
                return false;
            });
        } catch {
            return false;
        }
    };

    if (STATE_CHANGING_METHODS.has(req.method)) {
        const forwardedHost = req.headers['x-forwarded-host'];
        const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
        const forwardedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;

        if (isAllowed(origin) || isAllowed(referer) || isAllowed(forwardedOrigin)) {
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
