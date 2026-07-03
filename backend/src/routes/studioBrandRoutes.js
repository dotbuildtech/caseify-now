const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const studioBrandController = require('../controllers/studioBrandController');

router.get('/', studioBrandController.listStudioBrands);
router.get('/:id', studioBrandController.getStudioBrand);
router.post('/', protect, admin, studioBrandController.createStudioBrand);
router.put('/:id', protect, admin, studioBrandController.updateStudioBrand);
router.delete('/:id', protect, admin, studioBrandController.deleteStudioBrand);

module.exports = router;
