const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');
const controller = require('../controllers/studioTemplateV2Controller');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) return cb(new Error('Only PNG, SVG, JSON, JPEG, WEBP, GIF allowed'));
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

const uploadFields = upload.fields([
  { name: 'previewImage', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'maskSvg', maxCount: 1 },
  { name: 'cameraSvg', maxCount: 1 },
  { name: 'safeAreaSvg', maxCount: 1 },
  { name: 'bleedSvg', maxCount: 1 },
  { name: 'outlineSvg', maxCount: 1 },
]);

router.get('/', controller.listTemplates);
router.get('/by-device', controller.getTemplateByBrandModel);
router.get('/:id', controller.getTemplate);

router.post('/', protect, admin, uploadFields, controller.createTemplate);
router.put('/:id', protect, admin, uploadFields, controller.updateTemplate);
router.delete('/:id', protect, admin, controller.deleteTemplate);
router.post('/:id/duplicate', protect, admin, controller.duplicateTemplate);
router.patch('/:id/toggle-status', protect, admin, controller.toggleStatus);

module.exports = router;
