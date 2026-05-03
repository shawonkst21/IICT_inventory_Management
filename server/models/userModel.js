const { pool } = require('../config/db');

// Get user by email
async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

// Verify email by OTP hash and expiry
async function verifyUserEmailOtp(email, otpHash) {
  const result = await pool.query(
    `UPDATE users
     SET email_verified = true,
         otp_hash = NULL,
         otp_expires_at = NULL,
         otp_last_sent_at = NULL,
         otp_attempts = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE email = $1
       AND otp_hash = $2
       AND otp_expires_at > NOW()
       AND email_verified = false
     RETURNING id, name, email, role, expected_role, status, email_verified, created_at`,
    [email, otpHash]
  );

  return result.rows[0];
}

// Save/refresh OTP for registration verification
async function updateRegistrationOtp(email, otpHash, otpExpiresAt) {
  const result = await pool.query(
    `UPDATE users
     SET otp_hash = $2,
         otp_expires_at = $3,
         otp_last_sent_at = CURRENT_TIMESTAMP,
         otp_attempts = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE email = $1
     RETURNING id, name, email, role, expected_role, status, email_verified, created_at`,
    [email, otpHash, otpExpiresAt]
  );

  return result.rows[0];
}

// Increment OTP attempts to discourage brute-force verification tries
async function incrementOtpAttempts(email) {
  const result = await pool.query(
    `UPDATE users
     SET otp_attempts = COALESCE(otp_attempts, 0) + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE email = $1
     RETURNING otp_attempts`,
    [email]
  );

  return result.rows[0];
}

// Get user by ID
async function getUserById(id) {
  const result = await pool.query('SELECT id, name, email, role, expected_role, status, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// Create new user
async function createUser(name, email, passwordHash, requestedRole = 'user', otpHash = null, otpExpiresAt = null) {
  const result = await pool.query(
    `INSERT INTO users
      (name, email, password_hash, expected_role, role, status, email_verified, otp_hash, otp_expires_at, otp_last_sent_at, otp_attempts)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10)
     RETURNING id, name, email, role, expected_role, status, email_verified, created_at`,
    [name, email, passwordHash, requestedRole, requestedRole, 'pending', false, otpHash, otpExpiresAt, 0]
  );
  return result.rows[0];
}

// Keep registration details synced when resending OTP for unverified users
async function updateUnverifiedUserRegistration(email, name, passwordHash, requestedRole, otpHash, otpExpiresAt) {
  const result = await pool.query(
    `UPDATE users
     SET name = $2,
         password_hash = $3,
         expected_role = $4,
         status = 'pending',
         otp_hash = $5,
         otp_expires_at = $6,
         otp_last_sent_at = CURRENT_TIMESTAMP,
         otp_attempts = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE email = $1
       AND email_verified = false
     RETURNING id, name, email, role, expected_role, status, email_verified, created_at`,
    [email, name, passwordHash, requestedRole, otpHash, otpExpiresAt]
  );

  return result.rows[0];
}

// Get all pending users (for admin approval)
async function getPendingUsers() {
  const result = await pool.query(
    'SELECT id, name, email, role, expected_role, status, email_verified, created_at FROM users WHERE status = $1 AND email_verified = true ORDER BY created_at DESC',
    ['pending']
  );
  return result.rows;
}

// Get all users
async function getAllUsers() {
  const result = await pool.query(
    'SELECT id, name, email, role, expected_role, status, email_verified, created_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
}

// Approve user
async function approveUser(userId) {
  const result = await pool.query(
    'UPDATE users SET status = $1, role = expected_role, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND email_verified = true RETURNING id, name, email, role, expected_role, status, email_verified',
    ['approved', userId]
  );
  return result.rows[0];
}

// Reject user
async function rejectUser(userId) {
  const result = await pool.query(
    'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, expected_role, status',
    ['rejected', userId]
  );
  return result.rows[0];
}

// Update user role
async function updateUserRole(userId, role) {
  const result = await pool.query(
    'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, expected_role, status',
    [role, userId]
  );
  return result.rows[0];
}

// Update user profile (name and/or password)
async function updateUserProfile(userId, name, passwordHash) {
  let query = 'UPDATE users SET ';
  const params = [];
  let paramCount = 1;

  if (name !== undefined && name !== null) {
    query += `name = $${paramCount++}`;
    params.push(name);
  }

  if (passwordHash !== undefined && passwordHash !== null) {
    if (params.length > 0) query += ', ';
    query += `password_hash = $${paramCount++}`;
    params.push(passwordHash);
  }

  if (params.length === 0) {
    throw new Error('No fields to update');
  }

  query += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, name, email, role, status`;
  params.push(userId);

  const result = await pool.query(query, params);
  return result.rows[0];
}

// Delete user
async function deleteUser(userId) {
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING id'
  );
  return result.rows[0];
}

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  updateUserProfile,
  verifyUserEmailOtp,
  updateRegistrationOtp,
  incrementOtpAttempts,
  updateUnverifiedUserRegistration,
  deleteUser,
};
