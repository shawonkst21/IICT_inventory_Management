-- Create users table for authentication and role-based access
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  expected_role VARCHAR(50) CHECK (expected_role IN ('admin', 'manager', 'user')) NOT NULL DEFAULT 'user',
  role VARCHAR(50) CHECK (role IN ('admin', 'manager', 'user')) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('approved', 'rejected', 'pending')) NOT NULL DEFAULT 'pending',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  otp_hash VARCHAR(255),
  otp_expires_at TIMESTAMP,
  otp_last_sent_at TIMESTAMP,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
