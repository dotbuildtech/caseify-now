const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    sendOTP,
    verifyOTP
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/send-otp', protect, sendOTP);
router.post('/verify-otp', protect, verifyOTP);

module.exports = router;
