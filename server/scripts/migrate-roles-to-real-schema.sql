-- ============================================
-- Migration: Update role values to match real_database.sql
-- Change: 'inventory_manager' → 'manager', 'staff' → 'user'
-- ============================================

-- 1. Drop old constraints first to allow data update
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_expected_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Update existing data to new role values
UPDATE users SET role = 'manager' WHERE role = 'inventory_manager';
UPDATE users SET expected_role = 'manager' WHERE expected_role = 'inventory_manager';
UPDATE users SET role = 'user' WHERE role = 'staff';
UPDATE users SET expected_role = 'user' WHERE expected_role = 'staff';

-- 3. Add new constraints matching real_database.sql
ALTER TABLE users ADD CONSTRAINT users_expected_role_check 
  CHECK (expected_role IN ('admin', 'manager', 'user'));
  
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'manager', 'user'));

DO $$ BEGIN RAISE NOTICE 'Role migration completed!'; END $$;
