const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const deviceModelController = require('../controllers/deviceModelController');

router.get('/', deviceModelController.listDeviceModels);
router.get('/:id', deviceModelController.getDeviceModel);

router.post('/', protect, admin, deviceModelController.createDeviceModel);
router.put('/:id', protect, admin, deviceModelController.updateDeviceModel);
router.delete('/:id', protect, admin, deviceModelController.deleteDeviceModel);

module.exports = router;
