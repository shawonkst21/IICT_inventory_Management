const { pool } = require('../config/db');

// Get user by email
async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

// Get user by ID
async function getUserById(id) {
  const result = await pool.query('SELECT id, name, email, role, expected_role, status, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// Create new user
async function createUser(name, email, passwordHash, requestedRole = 'user') {
  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash, expected_role, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, expected_role, status, created_at',
    [name, email, passwordHash, requestedRole, 'user', 'pending']
  );
  return result.rows[0];
}

// Get all pending users (for admin approval)
async function getPendingUsers() {
  const result = await pool.query(
    'SELECT id, name, email, role, expected_role, status, created_at FROM users WHERE status = $1 ORDER BY created_at DESC',
    ['pending']
  );
  return result.rows;
}

// Get all users
async function getAllUsers() {
  const result = await pool.query(
    'SELECT id, name, email, role, expected_role, status, created_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
}

// Approve user
async function approveUser(userId) {
  const result = await pool.query(
    'UPDATE users SET status = $1, role = expected_role, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, expected_role, status',
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
  deleteUser,
};
