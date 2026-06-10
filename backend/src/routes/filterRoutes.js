const express = require('express');
const router = express.Router();
const { getFilters } = require('../controllers/filterController');

router.get('/', getFilters);

module.exports = router;
