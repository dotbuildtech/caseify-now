require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const originCheck = require('./middleware/originCheck');
const requestId = require('./middleware/requestId');
const { logSecurityEvent } = require('./utils/securityLog');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

if (process.env.TRUST_PROXY && process.env.TRUST_PROXY !== 'false') {
    const hops = parseInt(process.env.TRUST_PROXY, 10);
    app.set('trust proxy', Number.isFinite(hops) ? hops : 1);
}

app.disable('x-powered-by');

if (isProduction) {
    app.use((req, res, next) => {
        if (req.secure) return next();
        const host = req.headers.host;
        return res.redirect(301, `https://${host}${req.originalUrl}`);
    });
}

app.use(requestId);

app.use(helmet({
    contentSecurityPolicy: isProduction ? {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"]
        }
    } : false,
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    noSniff: true,
    frameguard: { action: 'deny' }
}));

const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const allowAnyOrigin = isProduction
    ? false
    : (allowedOrigins.length === 0 || allowedOrigins.includes('*'));

if (isProduction && allowedOrigins.length === 0) {
    console.error('[fatal] CORS_ORIGIN must be set in production');
    process.exit(1);
}

const corsOptions = {
    origin(origin, callback) {
        if (!origin) {
            if (isProduction) {
                return callback(new Error('Not allowed by CORS'));
            }
            return callback(null, true);
        }
        if (allowAnyOrigin) {
            if (isProduction && process.env.CORS_ALLOW_WILDCARD !== 'true') {
                return callback(new Error('Not allowed by CORS'));
            }
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 600
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

morgan.token('id', (req) => req.id);
app.use(morgan(isProduction ? ':id :remote-addr :method :url :status :res[content-length] - :response-time ms' : 'dev'));

app.use(originCheck);

app.set('etag', false);

app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

app.get('/.env', (req, res) => res.status(404).end());
app.get('/.git', (req, res) => res.status(404).end());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/accounting', require('./routes/accountingRoutes'));
app.use('/api/automation', require('./routes/automationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/financial', require('./routes/financialRoutes'));
app.use('/api/studio', require('./routes/studioRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/device-models', require('./routes/deviceModelRoutes'));
app.use('/api/hero-slides', require('./routes/heroSlideRoutes'));
app.use('/api/category-brands', require('./routes/categoryBrandRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/category-materials', require('./routes/categoryMaterialRoutes'));

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.send('Phone Cover Platform API is running...'));

app.use((req, res) => {
    res.status(404).json({ requestId: req.id, message: 'Not found' });
});

const isClientError = (err) => err.status >= 400 && err.status < 500;

app.use((err, req, res, next) => {
    const requestId = req.id;
    const isKnownClientErr = isClientError(err);

    if (!isKnownClientErr) {
        logSecurityEvent('error', {
            requestId,
            userId: req.user ? req.user.id : null,
            ip: req.ip,
            method: req.method,
            path: req.originalUrl,
            name: err.name,
            message: err.message
        });
    }

    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ requestId, message: 'Forbidden' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ requestId, message: 'Payload too large' });
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ requestId, message: 'Invalid JSON' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ requestId, message: 'File too large' });
    }
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        const fields = (err.errors || []).map((e) => ({ field: e.path, message: e.message }));
        return res.status(400).json({ requestId, message: 'Validation failed', errors: fields });
    }
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ requestId, message: 'Invalid reference' });
    }

    const status = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
    const message = status >= 500 ? 'Internal server error' : (err.message || 'Bad request');

    res.status(status).json({ requestId, message });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    (async () => {
        try {
            await connectDB();
        } catch (e) {
            console.error('Failed to start: connectDB threw:', e);
            process.exit(1);
        }
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    })();
}

module.exports = app;
