const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { listFilterOptions } = require('../controllers/filterOptionController');

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
});

router.get('/', limiter, listFilterOptions);

module.exports = router;
