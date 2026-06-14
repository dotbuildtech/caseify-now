const express = require('express');
const router = express.Router();
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

router.post('/', submitContact);

router.get('/', protect, admin, listMessages);
router.get('/unread-count', protect, admin, getUnreadCount);
router.get('/:id', protect, admin, getMessage);
router.put('/:id/read', protect, admin, markAsRead);
router.put('/:id/unread', protect, admin, markAsUnread);
router.put('/:id/reply', protect, admin, replyToMessage);
router.delete('/:id', protect, admin, deleteMessage);

module.exports = router;
