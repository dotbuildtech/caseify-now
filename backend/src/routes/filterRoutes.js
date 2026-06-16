const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getFilters } = require('../controllers/filterController');

const filterLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
});

router.get('/', filterLimiter, getFilters);

module.exports = router;
