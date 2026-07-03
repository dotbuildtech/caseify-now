const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const controller = require('../controllers/studioProductController');

router.get('/', protect, admin, controller.listStudioProducts);
router.get('/:id', protect, admin, controller.getStudioProduct);
router.post('/', protect, admin, controller.createStudioProduct);
router.put('/:id', protect, admin, controller.updateStudioProduct);
router.delete('/:id', protect, admin, controller.deleteStudioProduct);

module.exports = router;
