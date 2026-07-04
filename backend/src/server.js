require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { connectDB } = require('./config/db');
const originCheck = require('./middleware/originCheck');
const requestId = require('./middleware/requestId');
const { logSecurityEvent } = require('./utils/securityLog');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
app.set("trust proxy", 1);


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

app.use(cookieParser());

app.use(compression({
    level: 6,
    threshold: 512,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

app.use(helmet({
    contentSecurityPolicy: isProduction ? {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://accounts.google.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://accounts.google.com'],
            frameSrc: ["'self'", 'https://accounts.google.com'],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"]
        }
    } : false,
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    crossOriginOpenerPolicy: isProduction ? { policy: 'same-origin' } : { policy: 'unsafe-none' },
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

app.use((req, res, next) => {
    res.setTimeout(25000, () => {
        req.destroy();
    });
    next();
});

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 500) {
            console.log(`[slow] ${req.method} ${req.originalUrl} took ${duration}ms (status ${res.statusCode})`);
        } else if (process.env.LOG_ALL_RESPONSES === 'true') {
            console.log(`[api] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
        }
    });
    next();
});

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
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/custom-designs', require('./routes/customDesignRoutes'));
app.use('/api/filters', require('./routes/filterRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/homepage', require('./routes/homepageRoutes'));
app.use('/api/filter-options', require('./routes/filterOptionRoutes'));
app.use('/api/admin/filter-options', require('./routes/adminFilterOptionRoutes'));
app.use('/api/admin/dashboard', require('./routes/adminDashboardRoutes'));
app.use('/api/admin/brands', require('./routes/adminBrandRoutes'));
app.use('/api/admin/models', require('./routes/adminModelRoutes'));
app.use('/api/admin/studio-brands', require('./routes/studioBrandRoutes'));
app.use('/api/admin/studio-models', require('./routes/studioModelRoutes'));
app.use('/api/admin/studio-products', require('./routes/studioProductRoutes'));
app.use('/api/admin/studio-templates', require('./routes/studioTemplateRoutes'));

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.send('Caseify Now API is running...'));
app.get('/health', async (req, res, next) => {
    try {
        const { sequelize: db } = require('./config/db');
        await db.authenticate();
        res.json({ status: 'ok', db: 'connected', uptime: process.uptime() });
    } catch (err) {
        res.status(503).json({ status: 'error', db: 'disconnected', message: err.message });
    }
});

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
        const startTime = Date.now();
        console.log(`[startup] Node.js process started at ${new Date().toISOString()}`);

        try {
            const dbStart = Date.now();
            await connectDB();
            console.log(`[startup] Database connected in ${Date.now() - dbStart}ms`);
        } catch (e) {
            console.error('Failed to start: connectDB threw:', e);
            process.exit(1);
        }
        app.listen(PORT, () => {
            const elapsed = Date.now() - startTime;
            console.log(`[startup] Server started on port ${PORT} in ${elapsed}ms`);
        });
    })();
}

module.exports = app;
