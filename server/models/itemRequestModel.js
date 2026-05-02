const { pool } = require('../config/db');

async function findDefaultRequesterId() {
  const result = await pool.query(
    `SELECT id
     FROM users
     WHERE is_active = true
     ORDER BY
       CASE role
         WHEN 'user' THEN 1
         WHEN 'staff' THEN 1
         WHEN 'inventory_manager' THEN 2
         WHEN 'manager' THEN 2
         WHEN 'admin' THEN 3
        ELSE 4
       END,
       id ASC
     LIMIT 1`,
  );

  return result.rows[0]?.id ?? null;
}

async function findDefaultInventoryManagerId() {
  const result = await pool.query(
    `SELECT id
     FROM users
     WHERE is_active = true AND role = 'inventory_manager'
     ORDER BY id ASC
     LIMIT 1`,
  );

  return result.rows[0]?.id ?? null;
}

async function createItemRequest({ itemId, requestedBy, quantityRequested, department, purpose, recipientRoom }) {
  const insertResult = await pool.query(
    `INSERT INTO item_requests (item_id, requested_by, quantity_requested, department, purpose, recipient_room)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, item_id, requested_by, quantity_requested, department, purpose, recipient_room, status, requested_at`,
    [itemId, requestedBy, quantityRequested, department, purpose, recipientRoom],
  );

  return insertResult.rows[0];
}

async function listItemRequests(requesterId = null) {
  const params = [];
  let whereClause = '';

  if (requesterId) {
    params.push(requesterId);
    whereClause = `WHERE ir.requested_by = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT
       ir.id,
       ir.item_id,
       i.name AS item_name,
       i.current_stock AS stock_quantity,
       ir.requested_by,
       u.name AS requester_name,
       ir.approved_by,
       reviewer.name AS approved_by_name,
       ir.quantity_requested,
       ir.department,
       ir.purpose,
       ir.recipient_room,
       ir.status,
       ir.rejection_reason,
       ir.requested_at,
       ir.reviewed_at
     FROM item_requests ir
     INNER JOIN items i ON i.id = ir.item_id
     LEFT JOIN users u ON u.id = ir.requested_by
     LEFT JOIN users reviewer ON reviewer.id = ir.approved_by
     ${whereClause}
     ORDER BY ir.requested_at DESC, ir.id DESC`,
    params,
  );

  return result.rows;
}

async function findItemRequestById(requestId) {
  const result = await pool.query(
    `SELECT
       ir.id,
       ir.item_id,
       i.name AS item_name,
       i.current_stock AS stock_quantity,
       ir.requested_by,
       u.name AS requester_name,
       ir.approved_by,
       reviewer.name AS approved_by_name,
       ir.quantity_requested,
       ir.department,
       ir.purpose,
       ir.recipient_room,
       ir.status,
       ir.rejection_reason,
       ir.requested_at,
       ir.reviewed_at
     FROM item_requests ir
     INNER JOIN items i ON i.id = ir.item_id
     LEFT JOIN users u ON u.id = ir.requested_by
     LEFT JOIN users reviewer ON reviewer.id = ir.approved_by
     WHERE ir.id = $1`,
    [requestId],
  );

  return result.rows[0] || null;
}

async function reviewItemRequest({ requestId, reviewedBy, status, rejectionReason = null }) {
  const result = await pool.query(
    `UPDATE item_requests
     SET status = $2,
         approved_by = $3,
         rejection_reason = $4,
         reviewed_at = now()
     WHERE id = $1
     RETURNING id, item_id, requested_by, approved_by, quantity_requested, department, purpose, recipient_room, status, rejection_reason, requested_at, reviewed_at`,
    [requestId, status, reviewedBy, rejectionReason],
  );

  return result.rows[0] || null;
}

async function issueApprovedItemRequest({ requestId, issuedBy }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      `SELECT
         ir.id,
         ir.item_id,
         i.name AS item_name,
         i.current_stock AS stock_quantity,
         ir.requested_by,
         u.name AS requester_name,
         ir.quantity_requested,
         ir.department,
         ir.recipient_room,
         ir.status
       FROM item_requests ir
       INNER JOIN items i ON i.id = ir.item_id
       LEFT JOIN users u ON u.id = ir.requested_by
      WHERE ir.id = $1
      FOR UPDATE OF ir, i`,
      [requestId],
    );

    const request = requestResult.rows[0];

    if (!request) {
      throw new Error('Item request not found');
    }

    if (request.status !== 'approved') {
      throw new Error('Only approved requests can be issued');
    }

    if (request.stock_quantity < request.quantity_requested) {
      throw new Error('Insufficient stock to issue this request');
    }

    const issuanceResult = await client.query(
      `INSERT INTO item_issuances (
         request_id, item_id, issued_by, quantity_issued, recipient_name, recipient_room, recipient_dept, issued_date
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       RETURNING id, request_id, item_id, issued_by, quantity_issued, recipient_name, recipient_room, recipient_dept, issued_date`,
      [
        request.id,
        request.item_id,
        issuedBy,
        request.quantity_requested,
        request.requester_name || 'Requester',
        request.recipient_room,
        request.department,
      ],
    );

    await client.query(
      `UPDATE items
       SET current_stock = current_stock - $2
       WHERE id = $1`,
      [request.item_id, request.quantity_requested],
    );

    const updatedRequestResult = await client.query(
      `UPDATE item_requests
       SET status = 'issued',
           reviewed_at = now()
       WHERE id = $1
       RETURNING id`,
      [request.id],
    );

    await client.query('COMMIT');

    return {
      request: {
        ...request,
        status: 'issued',
      },
      issuance: issuanceResult.rows[0],
      updatedRequest: updatedRequestResult.rows[0],
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  findDefaultRequesterId,
  findDefaultInventoryManagerId,
  createItemRequest,
  listItemRequests,
  findItemRequestById,
  reviewItemRequest,
  issueApprovedItemRequest,
};
