const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    adminListFilterOptions,
    getFilterOption,
    createFilterOption,
    updateFilterOption,
    deleteFilterOption
} = require('../controllers/filterOptionController');

router.get('/', protect, admin, adminListFilterOptions);
router.get('/:id', protect, admin, getFilterOption);
router.post('/', protect, admin, createFilterOption);
router.put('/:id', protect, admin, updateFilterOption);
router.delete('/:id', protect, admin, deleteFilterOption);

module.exports = router;
