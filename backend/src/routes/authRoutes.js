const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logout,
    logoutAll,
    getUserProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    getUsers,
    sendOTP,
    verifyOTP
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const { authLimiter, loginLimiter, registerLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/refresh', authLimiter, refreshAccessToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.get('/profile', protect, authLimiter, getUserProfile);
router.put('/change-password', protect, authLimiter, changePassword);
router.post('/logout', protect, authLimiter, logout);
router.post('/logout-all', protect, authLimiter, logoutAll);
router.get('/users', protect, admin, authLimiter, getUsers);

router.post('/send-otp', protect, otpLimiter, sendOTP);
router.post('/verify-otp', protect, otpLimiter, verifyOTP);

module.exports = router;
