const { pool } = require('../config/db');

async function listPublishedTenderNotices() {
  const result = await pool.query(
    `SELECT
      tn.id,
      tn.created_by,
      u.name AS creator_name,
      tn.title,
      tn.summary,
      tn.file_path,
      tn.file_type,
      tn.deadline,
      tn.status
    FROM tender_notices tn
    LEFT JOIN users u ON u.id = tn.created_by
    WHERE tn.status = 'published'
    ORDER BY tn.deadline ASC, tn.id DESC`,
  );

  return result.rows;
}

async function listAdminTenderNotices() {
  const result = await pool.query(
    `SELECT
      tn.id,
      tn.created_by,
      u.name AS creator_name,
      tn.title,
      tn.summary,
      tn.file_path,
      tn.file_type,
      tn.deadline,
      tn.status
    FROM tender_notices tn
    LEFT JOIN users u ON u.id = tn.created_by
    ORDER BY
      CASE tn.status
        WHEN 'published' THEN 1
        WHEN 'draft' THEN 2
        WHEN 'expired' THEN 3
        ELSE 4
      END,
      tn.deadline ASC,
      tn.id DESC`,
  );

  return result.rows;
}

async function findTenderNoticeById(id) {
  const result = await pool.query(
    `SELECT id, created_by, title, summary, file_path, file_type, deadline, status
     FROM tender_notices
     WHERE id = $1`,
    [id],
  );

  return result.rows[0] || null;
}

async function createTenderNotice({ createdBy, title, summary, filePath, fileType, deadline, status }) {
  const result = await pool.query(
    `INSERT INTO tender_notices (created_by, title, summary, file_path, file_type, deadline, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_by, title, summary, file_path, file_type, deadline, status`,
    [createdBy || null, title, summary || null, filePath, fileType, deadline, status],
  );

  return result.rows[0];
}

async function updateTenderNotice(id, { title, summary, filePath, fileType, deadline, status }) {
  const result = await pool.query(
    `UPDATE tender_notices
     SET title = $2,
         summary = $3,
         file_path = COALESCE($4, file_path),
         file_type = COALESCE($5, file_type),
         deadline = $6,
         status = $7
     WHERE id = $1
     RETURNING id, created_by, title, summary, file_path, file_type, deadline, status`,
    [id, title, summary || null, filePath || null, fileType || null, deadline, status],
  );

  return result.rows[0] || null;
}

async function deleteTenderNotice(id) {
  const result = await pool.query(
    `DELETE FROM tender_notices
     WHERE id = $1
     RETURNING id, file_path`,
    [id],
  );

  return result.rows[0] || null;
}

module.exports = {
  listPublishedTenderNotices,
  listAdminTenderNotices,
  findTenderNoticeById,
  createTenderNotice,
  updateTenderNotice,
  deleteTenderNotice,
};
