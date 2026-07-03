const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const studioModelController = require('../controllers/studioModelController');

router.get('/', studioModelController.listStudioModels);
router.get('/:id', studioModelController.getStudioModel);
router.post('/', protect, admin, studioModelController.createStudioModel);
router.put('/:id', protect, admin, studioModelController.updateStudioModel);
router.delete('/:id', protect, admin, studioModelController.deleteStudioModel);

module.exports = router;
