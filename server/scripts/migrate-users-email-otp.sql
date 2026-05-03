-- Safe migration for existing databases to support OTP email verification

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS expected_role VARCHAR(50) CHECK (expected_role IN ('admin', 'manager', 'user')) DEFAULT 'user';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(255);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS otp_last_sent_at TIMESTAMP;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;

UPDATE users
SET expected_role = COALESCE(expected_role, role, 'user')
WHERE expected_role IS NULL;

-- Treat existing approved users as already email-verified
UPDATE users
SET email_verified = true
WHERE status = 'approved' AND email_verified = false;

CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
