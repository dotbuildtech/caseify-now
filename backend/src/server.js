require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const originCheck = require('./middleware/originCheck');

const app = express();

if (process.env.TRUST_PROXY && process.env.TRUST_PROXY !== 'false') {
    const hops = parseInt(process.env.TRUST_PROXY, 10);
    app.set('trust proxy', Number.isFinite(hops) ? hops : 1);
}

connectDB();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const allowAnyOrigin = allowedOrigins.includes('*');

const corsOptions = {
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowAnyOrigin) {
            if (process.env.CORS_ALLOW_WILDCARD === 'true') {
                return callback(null, true);
            }
            console.warn('[cors] wildcard origin ignored because CORS_ALLOW_WILDCARD is not set to true');
            return callback(new Error('Not allowed by CORS'));
        }
        if (allowedOrigins.length === 0) {
            return callback(new Error('Not allowed by CORS'));
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(originCheck);

// Routes
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

app.get('/', (req, res) => res.send('Phone Cover Platform API is running...'));

// Centralized error handler
app.use((err, req, res, next) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.error(`[${requestId}] ${err.stack || err.message || err}`);

    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Payload too large' });
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON' });
    }

    const status = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
    const message = status >= 500 ? 'Internal server error' : err.message;

    res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}

module.exports = app;
