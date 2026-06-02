const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    getUsers,
    sendOTP,
    verifyOTP
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, admin, getUsers);
router.post('/send-otp', protect, sendOTP);
router.post('/verify-otp', protect, verifyOTP);

module.exports = router;
