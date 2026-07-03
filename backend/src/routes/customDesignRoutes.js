const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const customDesignController = require('../controllers/customDesignController');

router.get('/', customDesignController.listCustomDesigns);
router.get('/:id', customDesignController.getCustomDesign);

router.post('/', protect, admin, customDesignController.createCustomDesign);
router.put('/:id', protect, admin, customDesignController.updateCustomDesign);
router.delete('/:id', protect, admin, customDesignController.deleteCustomDesign);

module.exports = router;
