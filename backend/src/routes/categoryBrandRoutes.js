const express = require('express');
const router = express.Router();
const {
    listForCategory,
    listAll,
    create,
    remove,
    bulkSet
} = require('../controllers/categoryBrandController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', listAll);
router.get('/:categoryName', listForCategory);
router.post('/', protect, admin, create);
router.post('/bulk', protect, admin, bulkSet);
router.delete('/:id', protect, admin, remove);

module.exports = router;
