require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.IICT_PGHOST || '127.0.0.1',
  port: Number.parseInt(process.env.IICT_PGPORT || '5432', 10),
  user: process.env.IICT_PGUSER || 'postgres',
  password: process.env.IICT_PGPASSWORD || '',
  database: process.env.IICT_PGDATABASE || 'postgres',
  ssl:
    (process.env.IICT_DATABASE_SSL || 'false').toLowerCase() === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query("select count(*)::int as count from information_schema.tables where table_schema='public'");
    if (existing.rows[0].count === 0) {
      throw new Error('No public tables found. Run the migrations first.');
    }

    // Generate a valid bcrypt hash for demo password
    const demoPassword = 'password123';
    const demoPasswordHash = await bcrypt.hash(demoPassword, 12);

    await client.query(`
      insert into users (name, email, password_hash, role, expected_role, is_active, email_verified, status)
      values
        ('Admin User', 'admin@iict.local', $1, 'admin', 'admin', true, true, 'approved'),
        ('Inventory Manager', 'inventory@iict.local', $1, 'manager', 'manager', true, true, 'approved'),
        ('Lab Assistant', 'staff@iict.local', $1, 'user', 'user', true, true, 'approved')
      on conflict (email) do update
      set name = excluded.name,
          password_hash = excluded.password_hash,
          role = excluded.role,
          expected_role = excluded.expected_role,
          is_active = excluded.is_active,
          email_verified = excluded.email_verified,
          status = excluded.status,
          updated_at = CURRENT_TIMESTAMP
    `, [demoPasswordHash]);

    const users = await client.query(
      `select id, email from users where email = any($1::text[]) order by email`,
      [['admin@iict.local', 'inventory@iict.local', 'staff@iict.local']],
    );
    const userIds = Object.fromEntries(users.rows.map((row) => [row.email, row.id]));

    await client.query(`
      insert into item_categories (name, description)
      values
        ('Electronics', 'Demo electronics and lab devices'),
        ('Stationery', 'Office and classroom stationery'),
        ('Safety', 'PPE and safety consumables')
      on conflict (name) do update
      set description = excluded.description
    `);

    const categories = await client.query(
      `select id, name from item_categories where name = any($1::text[]) order by name`,
      [['Electronics', 'Safety', 'Stationery']],
    );
    const categoryIds = Object.fromEntries(categories.rows.map((row) => [row.name, row.id]));

    await client.query(`
      insert into items (category_id, name, description, unit, current_stock, low_stock_threshold)
      values
        ($1, 'Wireless Mouse', 'Compact ergonomic mouse for office workstations', 'pcs', 25, 5),
        ($2, 'Safety Gloves', 'General-purpose protective gloves for lab use', 'pairs', 40, 10),
        ($3, 'A4 Paper Ream', 'Standard white office paper', 'reams', 60, 15)
      on conflict do nothing
    `, [categoryIds.Electronics, categoryIds.Safety, categoryIds.Stationery]);

    const items = await client.query(
      `select id, name from items where name = any($1::text[]) order by name`,
      [['A4 Paper Ream', 'Safety Gloves', 'Wireless Mouse']],
    );
    const itemIds = Object.fromEntries(items.rows.map((row) => [row.name, row.id]));

    const receiptResult = await client.query(`
      insert into item_receipts (
        item_id, received_by, quantity_received, supplier_name, challan_no, quality_status, bill_status, receipt_date
      ) values
        ($1, $2, 25, 'TechSource Ltd.', 'CH-2026-001', 'good', 'paid', current_date - interval '7 days'),
        ($3, $2, 40, 'SafeLab Supply', 'CH-2026-002', 'good', 'pending', current_date - interval '5 days'),
        ($4, $2, 60, 'PaperHub', 'CH-2026-003', 'partial', 'unpaid', current_date - interval '3 days')
      returning id
    `, [itemIds['Wireless Mouse'], userIds['inventory@iict.local'], itemIds['Safety Gloves'], itemIds['A4 Paper Ream']]);

    const requestResult = await client.query(`
      insert into item_requests (
        item_id, requested_by, approved_by, quantity_requested, purpose, department, recipient_room, status, rejection_reason, requested_at, reviewed_at
      ) values
        ($1, $2, $3, 3, 'Need mice for the admin office workstations', 'Administration', 'Room 204', 'approved', null, now() - interval '4 days', now() - interval '3 days'),
        ($4, $2, null, 10, 'Protective gloves for routine lab handling', 'Laboratory', 'Lab 1', 'pending', null, now() - interval '2 days', null),
        ($5, $3, $2, 5, 'Paper for printing requisitions and forms', 'Inventory', 'Store Room', 'issued', null, now() - interval '1 day', now() - interval '12 hours')
      returning id, item_id
    `, [itemIds['Wireless Mouse'], userIds['staff@iict.local'], userIds['admin@iict.local'], itemIds['Safety Gloves'], itemIds['A4 Paper Ream']]);

    const requestIds = requestResult.rows.map((row) => row.id);

    const tenderResult = await client.query(`
      insert into item_issuances (
        request_id, item_id, issued_by, quantity_issued, recipient_name, recipient_room, recipient_dept, issued_date
      ) values
        ($1, $2, $3, 3, 'Admin Office', 'Room 204', 'Administration', current_date - interval '2 days'),
        ($4, $5, $2, 5, 'Lab Assistant', 'Lab 1', 'Laboratory', current_date - interval '1 day')
      returning id
    `, [requestIds[0], itemIds['Wireless Mouse'], userIds['inventory@iict.local'], requestIds[2], itemIds['A4 Paper Ream']]);

    const tenderNotices = await client.query(`
      insert into tender_notices (
        created_by, title, rfq_number, description, submission_deadline, status, published_at
      ) values
        ($1, 'Procurement of Lab Accessories', 'RFQ-2026-014', 'Request for quotation for common lab accessories and peripherals', current_date + interval '12 days', 'published', now() - interval '1 day'),
        ($2, 'Office Stationery Supply Contract', 'RFQ-2026-015', 'Annual stationery supply for campus offices', current_date + interval '20 days', 'draft', null)
      returning id
    `, [userIds['admin@iict.local'], userIds['inventory@iict.local']]);

    await client.query(`
      insert into notifications (user_id, title, message, type, is_read)
      values
        ($1, 'Request Approved', 'Your wireless mouse request has been approved and issued.', 'success', false),
        ($2, 'Low Stock Warning', 'A4 paper stock is approaching the low-stock threshold.', 'warning', false),
        ($3, 'Tender Published', 'A new procurement tender has been published for review.', 'info', true)
    `, [userIds['staff@iict.local'], userIds['inventory@iict.local'], userIds['admin@iict.local']]);

    await client.query(`
      insert into audit_logs (user_id, action, table_name, record_id, details)
      values
        ($1, 'INSERT', 'users', $2, 'Seeded demo admin user'),
        ($3, 'INSERT', 'items', $4, 'Seeded demo inventory items'),
        ($5, 'INSERT', 'tender_notices', $6, 'Seeded demo tender notices')
    `, [userIds['admin@iict.local'], userIds['admin@iict.local'], userIds['inventory@iict.local'], itemIds['Wireless Mouse'], userIds['admin@iict.local'], tenderNotices.rows[0].id]);

    await client.query('COMMIT');

    console.log('Demo data seeded successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
