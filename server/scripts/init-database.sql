-- ============================================
-- IICT Inventory Management System
-- Complete Database Schema Migration
-- ============================================

-- Enable UUID extension if needed (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table 1: users (updated schema)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  expected_role VARCHAR(50) CHECK (expected_role IN ('admin', 'inventory_manager', 'staff')) NOT NULL DEFAULT 'staff',
  role VARCHAR(50) CHECK (role IN ('admin', 'inventory_manager', 'staff')) NOT NULL DEFAULT 'staff',
  status VARCHAR(50) CHECK (status IN ('approved', 'rejected', 'pending')) NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  otp_hash VARCHAR(255),
  otp_expires_at TIMESTAMP,
  otp_last_sent_at TIMESTAMP,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================
-- Table 2: item_categories
-- ============================================
CREATE TABLE IF NOT EXISTS item_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_categories_name ON item_categories(name);

-- ============================================
-- Table 3: items
-- ============================================
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES item_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50) NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

-- ============================================
-- Table 4: item_requests
-- ============================================
CREATE TABLE IF NOT EXISTS item_requests (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES items(id) NOT NULL,
  requested_by INTEGER REFERENCES users(id) NOT NULL,
  approved_by INTEGER REFERENCES users(id),
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  department VARCHAR(255),
  purpose TEXT,
  recipient_room VARCHAR(255),
  status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected', 'issued')) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_requests_item_id ON item_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_item_requests_requested_by ON item_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_item_requests_status ON item_requests(status);
CREATE INDEX IF NOT EXISTS idx_item_requests_requested_at ON item_requests(requested_at DESC);

-- ============================================
-- Table 5: item_receipts
-- ============================================
CREATE TABLE IF NOT EXISTS item_receipts (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES items(id) NOT NULL,
  received_by INTEGER REFERENCES users(id) NOT NULL,
  quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
  supplier_name VARCHAR(255),
  challan_no VARCHAR(255),
  quality_status VARCHAR(50) CHECK (quality_status IN ('good', 'partial', 'rejected')) NOT NULL,
  bill_status VARCHAR(50) CHECK (bill_status IN ('paid', 'pending', 'unpaid')) NOT NULL,
  receipt_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_receipts_item_id ON item_receipts(item_id);
CREATE INDEX IF NOT EXISTS idx_item_receipts_received_by ON item_receipts(received_by);
CREATE INDEX IF NOT EXISTS idx_item_receipts_receipt_date ON item_receipts(receipt_date DESC);

-- ============================================
-- Table 6: item_issuances
-- ============================================
CREATE TABLE IF NOT EXISTS item_issuances (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES item_requests(id) NOT NULL,
  item_id INTEGER REFERENCES items(id) NOT NULL,
  issued_by INTEGER REFERENCES users(id) NOT NULL,
  quantity_issued INTEGER NOT NULL CHECK (quantity_issued > 0),
  recipient_name VARCHAR(255),
  recipient_room VARCHAR(255),
  recipient_dept VARCHAR(255),
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_issuances_request_id ON item_issuances(request_id);
CREATE INDEX IF NOT EXISTS idx_item_issuances_item_id ON item_issuances(item_id);
CREATE INDEX IF NOT EXISTS idx_item_issuances_issued_by ON item_issuances(issued_by);
CREATE INDEX IF NOT EXISTS idx_item_issuances_issued_date ON item_issuances(issued_date DESC);

-- ============================================
-- Table 7: tender_notices
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_tender_notices_created_by ON tender_notices(created_by);
CREATE INDEX IF NOT EXISTS idx_tender_notices_status ON tender_notices(status);
CREATE INDEX IF NOT EXISTS idx_tender_notices_deadline ON tender_notices(deadline);

-- ============================================
-- Table 8: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error')) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- Table 9: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- Add updated_at trigger function (optional)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_item_categories_updated_at ON item_categories;
CREATE TRIGGER update_item_categories_updated_at BEFORE UPDATE ON item_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
END $$;
