const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const controller = require('../controllers/studioTemplateController');

router.post('/full', protect, admin, controller.saveFullTemplate);
router.post('/', protect, admin, controller.createTemplate);
router.get('/product/:productId', controller.getTemplateByProductId);
router.get('/:id', controller.getTemplate);
router.put('/:id', protect, admin, controller.updateTemplate);
router.delete('/:id', protect, admin, controller.deleteTemplate);

router.post('/areas', protect, admin, controller.createEditableArea);
router.put('/areas/:id', protect, admin, controller.updateEditableArea);
router.delete('/areas/:id', protect, admin, controller.deleteEditableArea);
router.post('/areas/:id/duplicate', protect, admin, controller.duplicateEditableArea);
router.put('/areas/reorder', protect, admin, controller.reorderAreas);
router.get('/areas/list', controller.listEditableAreas);

module.exports = router;
