const express = require('express');
const router = express.Router();
const {
    getCart,
    addItemToCart,
    removeItemFromCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCart);
router.post('/', protect, addItemToCart);
router.delete('/:productId', protect, removeItemFromCart);

module.exports = router;
