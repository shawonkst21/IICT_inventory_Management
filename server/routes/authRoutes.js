const express = require('express');
const {
	register,
	verifyRegistrationOtp,
	resendRegistrationOtp,
	login,
	forgotPassword,
	verifyForgotOtp,
	resetPassword,
	getUsers,
	getPending,
	approve,
	reject,
	updateRole,
	updateProfile,
} = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/register/verify-otp', verifyRegistrationOtp);
router.post('/register/resend-otp', resendRegistrationOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/verify-otp', verifyForgotOtp);
router.post('/reset-password', resetPassword);

// Protected routes (authenticated users)
router.patch('/profile', verifyToken, updateProfile);

// Admin only routes
router.get('/admin/users', verifyToken, isAdmin, getUsers);
router.get('/admin/pending', verifyToken, isAdmin, getPending);
router.patch('/admin/approve/:userId', verifyToken, isAdmin, approve);
router.patch('/admin/reject/:userId', verifyToken, isAdmin, reject);
router.patch('/admin/users/:userId/role', verifyToken, isAdmin, updateRole);

module.exports = router;
