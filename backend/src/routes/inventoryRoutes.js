const express = require('express');
const router = express.Router();
const {
    getInventory,
    updateStock,
    getLowStock
} = require('../controllers/inventoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getInventory);
router.get('/low-stock', protect, admin, getLowStock);
router.put('/:id', protect, admin, updateStock);

module.exports = router;
