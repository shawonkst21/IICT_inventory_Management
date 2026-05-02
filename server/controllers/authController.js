const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getUserByEmail, getUserById, createUser, getAllUsers, getPendingUsers, approveUser, rejectUser, updateUserRole, updateUserProfile } = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register new user
async function register(req, res) {
  try {
    const { name, email, password, confirmPassword, requestedRole } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with pending status
    const role = requestedRole || 'user';
    const newUser = await createUser(name, email, passwordHash, role);

    return res.status(201).json({
      message: 'Registration successful. Awaiting admin approval.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Login user
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is approved
    if (user.status !== 'approved') {
      return res.status(403).json({ error: `Your account is ${user.status}. Please wait for admin approval.` });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get all users (admin only)
async function getUsers(req, res) {
  try {
    const users = await getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get pending users (admin only)
async function getPending(req, res) {
  try {
    const users = await getPendingUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.error('Get pending users error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Approve user (admin only)
async function approve(req, res) {
  try {
    const { userId } = req.params;
    const user = await approveUser(userId);
    return res.status(200).json({
      message: 'User approved successfully',
      user,
    });
  } catch (error) {
    console.error('Approve user error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Reject user (admin only)
async function reject(req, res) {
  try {
    const { userId } = req.params;
    const user = await rejectUser(userId);
    return res.status(200).json({
      message: 'User rejected',
      user,
    });
  } catch (error) {
    console.error('Reject user error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Update user role (admin only)
async function updateRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await updateUserRole(userId, role);
    return res.status(200).json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Update user profile (name and/or password)
async function updateProfile(req, res) {
  try {
    const userId = req.user.id; // From auth middleware
    const { name, currentPassword, newPassword } = req.body;

    // Validate input
    if (!name && !newPassword) {
      return res.status(400).json({ error: 'Must update either name or password' });
    }

    // If updating password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to update password' });
      }

      const user = await getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
    }

    // Hash new password if provided
    let newPasswordHash = undefined;
    if (newPassword) {
      newPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    // Update user profile
    const updatedUser = await updateUserProfile(userId, name, newPasswordHash);

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  register,
  login,
  getUsers,
  getPending,
  approve,
  reject,
  updateRole,
  updateProfile,
};
