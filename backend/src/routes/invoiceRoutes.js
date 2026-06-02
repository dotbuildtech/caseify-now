const express = require('express');
const router = express.Router();
const {
    downloadInvoice,
    getMyInvoices
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my', protect, getMyInvoices);
router.get('/:id/download', protect, downloadInvoice);

module.exports = router;
