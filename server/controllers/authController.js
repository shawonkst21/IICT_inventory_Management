const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
  getUserByEmail,
  getUserById,
  createUser,
  getAllUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  updateUserProfile,
  verifyUserEmailOtp,
  updateRegistrationOtp,
  incrementOtpAttempts,
  updateUnverifiedUserRegistration,
} = require('../models/userModel');
const { sendOtpEmail } = require('../utils/mailer');
const { logAuditAction } = require('../models/auditModel');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const OTP_EXPIRY_MINUTES = Number.parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);

function generateOtpCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function getOtpExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

// Register new user
async function register(req, res) {
  try {
    const { name, email, password, confirmPassword, requestedRole } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validate input
    if (!name || !normalizedEmail || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(normalizedEmail);

    // Hash password and OTP before storing
    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = generateOtpCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiresAt = getOtpExpiryDate();

    // Create/refresh user with pending status and unverified email
    const role = requestedRole || 'user';
    let newUser;

    if (existingUser) {
      if (existingUser.email_verified) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      newUser = await updateUnverifiedUserRegistration(
        normalizedEmail,
        name,
        passwordHash,
        role,
        otpHash,
        otpExpiresAt
      );
    } else {
      newUser = await createUser(name, normalizedEmail, passwordHash, role, otpHash, otpExpiresAt);
    }

    await sendOtpEmail(normalizedEmail, otpCode, OTP_EXPIRY_MINUTES);

    return res.status(201).json({
      message: 'OTP sent to your email. Verify OTP to continue.',
      requiresOtp: true,
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

// Verify registration OTP
async function verifyRegistrationOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedOtp = String(otp || '').trim();

    if (!normalizedEmail || !normalizedOtp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(200).json({ message: 'Email already verified.' });
    }

    if (!user.otp_hash || !user.otp_expires_at) {
      return res.status(400).json({ error: 'No OTP found. Please request a new OTP.' });
    }

    if (new Date(user.otp_expires_at) <= new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    const isOtpValid = await bcrypt.compare(normalizedOtp, user.otp_hash);
    if (!isOtpValid) {
      const attempts = await incrementOtpAttempts(normalizedEmail);
      if (attempts && attempts.otp_attempts >= 5) {
        return res.status(429).json({ error: 'Too many invalid OTP attempts. Request a new OTP.' });
      }

      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const verifiedUser = await verifyUserEmailOtp(normalizedEmail, user.otp_hash);
    if (!verifiedUser) {
      return res.status(400).json({ error: 'Unable to verify OTP. Please try again.' });
    }

    return res.status(200).json({
      message: 'Email verified successfully. Awaiting admin approval.',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        status: verifiedUser.status,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Resend registration OTP for unverified account
async function resendRegistrationOtp(req, res) {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const otpCode = generateOtpCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiresAt = getOtpExpiryDate();

    await updateRegistrationOtp(normalizedEmail, otpHash, otpExpiresAt);
    await sendOtpEmail(normalizedEmail, otpCode, OTP_EXPIRY_MINUTES);

    return res.status(200).json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
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

    if (!user) {
      return res.status(400).json({ error: 'User cannot be approved before email verification' });
    }

    await logAuditAction({
      userId: req.user?.id,
      action: 'APPROVE',
      tableName: 'users',
      recordId: parseInt(userId, 10),
      details: `Approved user: ${user.name} (${user.email})`,
    });

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

    await logAuditAction({
      userId: req.user?.id,
      action: 'REJECT',
      tableName: 'users',
      recordId: parseInt(userId, 10),
      details: `Rejected user: ${user.name} (${user.email})`,
    });

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

    await logAuditAction({
      userId: req.user?.id,
      action: 'UPDATE_ROLE',
      tableName: 'users',
      recordId: parseInt(userId, 10),
      details: `Updated user role: ${user.name} -> ${role}`,
    });

    return res.status(200).json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Forgot password - send OTP to email
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.email_verified) {
      return res.status(400).json({ error: 'Please verify your email first by completing registration' });
    }

    const otpCode = generateOtpCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiresAt = getOtpExpiryDate();

    await updateRegistrationOtp(normalizedEmail, otpHash, otpExpiresAt);
    await sendOtpEmail(normalizedEmail, otpCode, OTP_EXPIRY_MINUTES);

    return res.status(200).json({ message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Verify forgot password OTP (without resetting password)
async function verifyForgotOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedOtp = String(otp || '').trim();

    if (!normalizedEmail || !normalizedOtp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.otp_hash || !user.otp_expires_at) {
      return res.status(400).json({ error: 'No OTP found. Request a new one.' });
    }

    if (new Date(user.otp_expires_at) <= new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    }

    const isOtpValid = await bcrypt.compare(normalizedOtp, user.otp_hash);
    if (!isOtpValid) {
      const attempts = await incrementOtpAttempts(normalizedEmail);
      if (attempts && attempts.otp_attempts >= 5) {
        return res.status(429).json({ error: 'Too many invalid OTP attempts. Request a new OTP.' });
      }
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    return res.status(200).json({ message: 'OTP verified successfully. You can now reset your password.' });
  } catch (error) {
    console.error('Verify forgot OTP error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Reset password with OTP
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedOtp = String(otp || '').trim();

    if (!normalizedEmail || !normalizedOtp || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.otp_hash || !user.otp_expires_at) {
      return res.status(400).json({ error: 'No OTP found. Request a new one.' });
    }

    if (new Date(user.otp_expires_at) <= new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    }

    const isOtpValid = await bcrypt.compare(normalizedOtp, user.otp_hash);
    if (!isOtpValid) {
      const attempts = await incrementOtpAttempts(normalizedEmail);
      if (attempts && attempts.otp_attempts >= 5) {
        return res.status(429).json({ error: 'Too many invalid OTP attempts. Request a new OTP.' });
      }

      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const updatedUser = await updateUserProfile(user.id, undefined, newPasswordHash);

    // Clear OTP after successful reset
    await updateRegistrationOtp(normalizedEmail, null, null);

    return res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
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
};
