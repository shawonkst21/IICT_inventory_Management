const { pool } = require('../config/db');

async function createItemRequest({ itemId, quantityRequested, department, purpose, recipientRoom }) {
  const insertResult = await pool.query(
    `INSERT INTO item_requests (item_id, quantity_requested, department, purpose, recipient_room)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, item_id, quantity_requested, department, purpose, recipient_room`,
    [itemId, quantityRequested, department, purpose, recipientRoom],
  );

  return insertResult.rows[0];
}

module.exports = {
  createItemRequest,
};
