-- ============================================================================
-- IICT Inventory Management System - Complete Database Schema
-- ============================================================================
-- This script creates all tables and indexes for the production deployment
-- Run this on your target database to set up the complete schema
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE - Authentication and Role-Based Access Control
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  expected_role VARCHAR(50) CHECK (expected_role IN ('admin', 'manager', 'user')) DEFAULT 'user',
  role VARCHAR(50) CHECK (role IN ('admin', 'manager', 'user')) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('approved', 'rejected', 'pending')) NOT NULL DEFAULT 'pending',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  otp_hash VARCHAR(255),
  otp_expires_at TIMESTAMP,
  otp_last_sent_at TIMESTAMP,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================================
-- 2. ITEM CATEGORIES TABLE - Organize items by category
-- ============================================================================
CREATE TABLE IF NOT EXISTS item_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for item_categories table
CREATE INDEX IF NOT EXISTS idx_item_categories_name ON item_categories(name);

-- ============================================================================
-- 3. ITEMS TABLE - Inventory items and stock management
-- ============================================================================
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES item_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50) NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for items table
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_current_stock ON items(current_stock);

-- ============================================================================
-- 4. ITEM RECEIPTS TABLE - Track incoming inventory
-- ============================================================================
CREATE TABLE IF NOT EXISTS item_receipts (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  quantity_received INTEGER NOT NULL,
  supplier_name VARCHAR(255),
  challan_no VARCHAR(100),
  quality_status VARCHAR(50) DEFAULT 'good',
  bill_status VARCHAR(50) DEFAULT 'unpaid',
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for item_receipts table
CREATE INDEX IF NOT EXISTS idx_item_receipts_item_id ON item_receipts(item_id);
CREATE INDEX IF NOT EXISTS idx_item_receipts_received_by ON item_receipts(received_by);
CREATE INDEX IF NOT EXISTS idx_item_receipts_receipt_date ON item_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_item_receipts_challan_no ON item_receipts(challan_no);

-- ============================================================================
-- 5. ITEM REQUESTS TABLE - Track inventory requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS item_requests (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  quantity_requested INTEGER NOT NULL,
  department VARCHAR(255),
  purpose TEXT,
  recipient_room VARCHAR(100),
  status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected', 'issued')) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for item_requests table
CREATE INDEX IF NOT EXISTS idx_item_requests_item_id ON item_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_item_requests_requested_by ON item_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_item_requests_approved_by ON item_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_item_requests_status ON item_requests(status);
CREATE INDEX IF NOT EXISTS idx_item_requests_requested_at ON item_requests(requested_at);

-- ============================================================================
-- 6. ITEM ISSUANCES TABLE - Track issued items
-- ============================================================================
CREATE TABLE IF NOT EXISTS item_issuances (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES item_requests(id) ON DELETE SET NULL,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  quantity_issued INTEGER NOT NULL,
  recipient_name VARCHAR(255),
  recipient_room VARCHAR(100),
  recipient_dept VARCHAR(255),
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for item_issuances table
CREATE INDEX IF NOT EXISTS idx_item_issuances_request_id ON item_issuances(request_id);
CREATE INDEX IF NOT EXISTS idx_item_issuances_item_id ON item_issuances(item_id);
CREATE INDEX IF NOT EXISTS idx_item_issuances_issued_by ON item_issuances(issued_by);
CREATE INDEX IF NOT EXISTS idx_item_issuances_issued_date ON item_issuances(issued_date);

-- ============================================================================
-- 7. TENDER NOTICES TABLE - Track procurement tenders
-- ============================================================================
CREATE TABLE IF NOT EXISTS tender_notices (
  id SERIAL PRIMARY KEY,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  deadline DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('draft', 'published', 'expired', 'archived')) NOT NULL DEFAULT 'draft'
);

-- Create indexes for tender_notices table
CREATE INDEX IF NOT EXISTS idx_tender_notices_created_by ON tender_notices(created_by);
CREATE INDEX IF NOT EXISTS idx_tender_notices_status ON tender_notices(status);
CREATE INDEX IF NOT EXISTS idx_tender_notices_deadline ON tender_notices(deadline);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE - User notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- 9. AUDIT LOGS TABLE - Track system actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- 10. APPLY OTP EMAIL VERIFICATION MIGRATIONS (Safe for existing databases)
-- ============================================================================
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

-- Update existing approved users as email-verified
UPDATE users
SET email_verified = true
WHERE status = 'approved' AND email_verified = false;

-- ============================================================================
-- END OF SCHEMA CREATION
-- ============================================================================
-- All tables, constraints, and indexes have been created successfully
-- The database is ready for use with the IICT Inventory Management System
-- ============================================================================
