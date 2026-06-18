const express = require('express');
const router = express.Router();
const { getHomepage } = require('../controllers/homepageController');
const rateLimit = require('express-rate-limit');

const homepageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { message: 'Too many requests, please try again later' }
});

router.get('/', homepageLimiter, getHomepage);

module.exports = router;
