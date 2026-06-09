const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const brandController = require('../controllers/brandController');

router.get('/', brandController.listBrands);
router.get('/:id', brandController.getBrand);
router.get('/:id/models', brandController.getBrandModels);

router.post('/', protect, admin, brandController.createBrand);
router.put('/:id', protect, admin, brandController.updateBrand);
router.delete('/:id', protect, admin, brandController.deleteBrand);

module.exports = router;
