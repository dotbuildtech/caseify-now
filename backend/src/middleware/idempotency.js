const crypto = require('crypto');

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_KEYS = 5000;
const KEY_RE = /^[A-Za-z0-9_\-]{8,128}$/;

const store = new Map();

const hashKey = (userId, key) => crypto.createHash('sha256').update(`${userId}:${key}`).digest('hex');

const idempotency = (req, res, next) => {
    const raw = req.headers['idempotency-key'];
    if (!raw) return next();
    if (typeof raw !== 'string' || !KEY_RE.test(raw)) {
        return res.status(400).json({ message: 'Invalid Idempotency-Key' });
    }
    if (!req.user) return next();

    const h = hashKey(req.user.id, raw);
    const cached = store.get(h);
    if (cached && cached.expires > Date.now()) {
        cached.hits += 1;
        res.setHeader('Idempotent-Replay', 'true');
        return res.status(cached.status).json(cached.body);
    }
    if (cached && cached.expires <= Date.now()) {
        store.delete(h);
    }

    req._idempotencyHash = h;
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode < 500) {
            store.set(h, { status: res.statusCode, body, expires: Date.now() + TTL_MS, hits: 0 });
            if (store.size > MAX_KEYS) {
                const first = store.keys().next().value;
                store.delete(first);
            }
        }
        return originalJson(body);
    };
    next();
};

module.exports = idempotency;
