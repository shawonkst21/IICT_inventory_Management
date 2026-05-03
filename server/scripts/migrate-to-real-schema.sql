-- ============================================
-- Migration: Update schema to match real_database.sql
-- Keep existing role values ('admin', 'inventory_manager', 'staff')
-- ============================================

-- ============================================
-- 1. Update items table
-- ============================================
ALTER TABLE items ALTER COLUMN low_stock_threshold SET DEFAULT 0;

-- ============================================
-- 2. Update item_receipts table
-- ============================================

-- Drop existing foreign key and add with CASCADE
ALTER TABLE item_receipts DROP CONSTRAINT IF EXISTS item_receipts_item_id_fkey;
ALTER TABLE item_receipts ADD FOREIGN KEY (item_id) 
  REFERENCES items(id) ON DELETE CASCADE;

-- Make columns optional with defaults
ALTER TABLE item_receipts ALTER COLUMN quality_status DROP NOT NULL;
ALTER TABLE item_receipts ALTER COLUMN quality_status SET DEFAULT 'good';
ALTER TABLE item_receipts ALTER COLUMN bill_status DROP NOT NULL;
ALTER TABLE item_receipts ALTER COLUMN bill_status SET DEFAULT 'unpaid';

-- Update challan_no length
ALTER TABLE item_receipts ALTER COLUMN challan_no TYPE VARCHAR(100);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_item_receipts_updated_at ON item_receipts;
CREATE TRIGGER update_item_receipts_updated_at BEFORE UPDATE ON item_receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Update item_requests table
-- ============================================
ALTER TABLE item_requests DROP CONSTRAINT IF EXISTS item_requests_item_id_fkey;
ALTER TABLE item_requests ADD FOREIGN KEY (item_id) 
  REFERENCES items(id) ON DELETE CASCADE;

-- Update column types
ALTER TABLE item_requests ALTER COLUMN recipient_room TYPE VARCHAR(100);

-- ============================================
-- 4. Update item_issuances table
-- ============================================
ALTER TABLE item_issuances DROP CONSTRAINT IF EXISTS item_issuances_item_id_fkey;
ALTER TABLE item_issuances ADD FOREIGN KEY (item_id) 
  REFERENCES items(id) ON DELETE CASCADE;

-- Update column types
ALTER TABLE item_issuances ALTER COLUMN recipient_room TYPE VARCHAR(100);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_item_issuances_updated_at ON item_issuances;
CREATE TRIGGER update_item_issuances_updated_at BEFORE UPDATE ON item_issuances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Update tender_notices table
-- ============================================
DROP TRIGGER IF EXISTS update_tender_notices_updated_at ON tender_notices;

DROP INDEX IF EXISTS idx_tender_notices_rfq_number;
DROP INDEX IF EXISTS idx_tender_notices_published_at;
DROP INDEX IF EXISTS idx_tender_notices_submission_deadline;

ALTER TABLE tender_notices DROP CONSTRAINT IF EXISTS tender_notices_rfq_number_key;
ALTER TABLE tender_notices DROP CONSTRAINT IF EXISTS tender_notices_status_check;

ALTER TABLE tender_notices
  ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE tender_notices
  ADD COLUMN IF NOT EXISTS file_path TEXT NOT NULL DEFAULT '';

ALTER TABLE tender_notices
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(50) NOT NULL DEFAULT 'unknown';

ALTER TABLE tender_notices
  ADD COLUMN IF NOT EXISTS deadline DATE;

UPDATE tender_notices
SET summary = COALESCE(summary, description)
WHERE summary IS NULL;

UPDATE tender_notices
SET deadline = COALESCE(deadline, submission_deadline, CURRENT_DATE)
WHERE deadline IS NULL;

UPDATE tender_notices
SET status = CASE
  WHEN status = 'closed' THEN 'expired'
  WHEN status = 'awarded' THEN 'archived'
  ELSE status
END;

ALTER TABLE tender_notices
  ALTER COLUMN deadline SET NOT NULL;

ALTER TABLE tender_notices
  ADD CONSTRAINT tender_notices_status_check
  CHECK (status IN ('draft', 'published', 'expired', 'archived'));

ALTER TABLE tender_notices
  DROP COLUMN IF EXISTS rfq_number,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS submission_deadline,
  DROP COLUMN IF EXISTS published_at,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE tender_notices
  ALTER COLUMN file_path DROP DEFAULT;

ALTER TABLE tender_notices
  ALTER COLUMN file_type DROP DEFAULT;

-- ============================================
-- 6. Update notifications table
-- ============================================
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD FOREIGN KEY (user_id) 
  REFERENCES users(id) ON DELETE CASCADE;

-- Make type optional with default
ALTER TABLE notifications ALTER COLUMN type DROP NOT NULL;
ALTER TABLE notifications ALTER COLUMN type SET DEFAULT 'info';

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Update audit_logs table
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'audit_logs_action_check'
  ) THEN
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_check 
      CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'));
  END IF;
END $$;

-- ============================================
-- 8. Add missing indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_items_current_stock ON items(current_stock);
CREATE INDEX IF NOT EXISTS idx_item_receipts_challan_no ON item_receipts(challan_no);
CREATE INDEX IF NOT EXISTS idx_tender_notices_deadline ON tender_notices(deadline);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- 9. Ensure all tables have updated_at triggers
-- ============================================
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
DO $$ BEGIN RAISE NOTICE 'Migration to real schema completed successfully!'; END $$;
