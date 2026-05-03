const { pool } = require('../config/db');

async function listAuditLogs({ search, action, tableName, fromDate, toDate, limit = 200 } = {}) {
  const filters = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    filters.push(`(
      al.details ILIKE $${params.length}
      OR al.action ILIKE $${params.length}
      OR al.table_name ILIKE $${params.length}
      OR CAST(al.record_id AS TEXT) ILIKE $${params.length}
      OR u.name ILIKE $${params.length}
      OR u.email ILIKE $${params.length}
    )`);
  }

  if (action) {
    params.push(action);
    filters.push(`al.action = $${params.length}`);
  }

  if (tableName) {
    params.push(tableName);
    filters.push(`al.table_name = $${params.length}`);
  }

  if (fromDate) {
    params.push(fromDate);
    filters.push(`al.created_at >= $${params.length}`);
  }

  if (toDate) {
    params.push(`${toDate} 23:59:59`);
    filters.push(`al.created_at <= $${params.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  params.push(limit);

  const query = `
    SELECT
      al.id,
      al.user_id,
      u.name AS user_name,
      u.email AS user_email,
      al.action,
      al.table_name,
      al.record_id,
      al.details,
      al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT $${params.length}
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

async function logAuditAction({ userId, action, tableName, recordId, details } = {}) {
  try {
    const query = `
      INSERT INTO audit_logs (user_id, action, table_name, record_id, details, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const result = await pool.query(query, [userId || null, action, tableName, recordId || null, details || null]);
    return result.rows[0];
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

module.exports = {
  listAuditLogs,
  logAuditAction,
};
