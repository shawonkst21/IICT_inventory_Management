const express = require('express');
const { register, login, getUsers, getPending, approve, reject, updateRole, updateProfile } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (authenticated users)
router.patch('/profile', verifyToken, updateProfile);

// Admin only routes
router.get('/admin/users', verifyToken, isAdmin, getUsers);
router.get('/admin/pending', verifyToken, isAdmin, getPending);
router.patch('/admin/approve/:userId', verifyToken, isAdmin, approve);
router.patch('/admin/reject/:userId', verifyToken, isAdmin, reject);
router.patch('/admin/users/:userId/role', verifyToken, isAdmin, updateRole);

module.exports = router;
