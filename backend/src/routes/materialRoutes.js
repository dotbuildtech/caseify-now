const express = require('express');
const router = express.Router();
const {
    listMaterials,
    getMaterial,
    createMaterial,
    updateMaterial,
    deleteMaterial
} = require('../controllers/materialController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', listMaterials);
router.get('/:id', getMaterial);
router.post('/', protect, admin, createMaterial);
router.put('/:id', protect, admin, updateMaterial);
router.delete('/:id', protect, admin, deleteMaterial);

module.exports = router;
