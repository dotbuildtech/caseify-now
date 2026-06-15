const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect, admin } = require('../middleware/authMiddleware');
const {
    submitContact,
    listMessages,
    getMessage,
    markAsRead,
    markAsUnread,
    replyToMessage,
    deleteMessage,
    getUnreadCount
} = require('../controllers/contactController');

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many contact submissions. Please try again later.' }
});

const replyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many replies. Please try again later.' }
});

router.post('/', contactLimiter, submitContact);

router.get('/', protect, admin, listMessages);
router.get('/unread-count', protect, admin, getUnreadCount);
router.get('/:id', protect, admin, getMessage);
router.put('/:id/read', protect, admin, markAsRead);
router.put('/:id/unread', protect, admin, markAsUnread);
router.put('/:id/reply', protect, admin, replyLimiter, replyToMessage);
router.delete('/:id', protect, admin, deleteMessage);

module.exports = router;
