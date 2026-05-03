const { pool } = require('../config/db');

async function findDefaultReceiverId() {
  const preferred = await pool.query(
    `SELECT id
     FROM users
      WHERE is_active = true AND role = 'manager'
     ORDER BY id ASC
     LIMIT 1`,
  );

  if (preferred.rows[0]?.id) {
    return preferred.rows[0].id;
  }

  const fallback = await pool.query(
    `SELECT id
     FROM users
     WHERE is_active = true
     ORDER BY id ASC
     LIMIT 1`,
  );

  return fallback.rows[0]?.id ?? null;
}

async function createItemReceiptAndUpdateStock({
  itemId,
  receivedBy,
  quantityReceived,
  supplierName,
  challanNo,
  qualityStatus,
  billStatus,
  receiptDate,
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const itemResult = await client.query(
      `SELECT id, current_stock
       FROM items
       WHERE id = $1
       FOR UPDATE`,
      [itemId],
    );

    const item = itemResult.rows[0];
    if (!item) {
      throw new Error('Item not found');
    }

    const receiptResult = await client.query(
      `INSERT INTO item_receipts (
         item_id,
         received_by,
         quantity_received,
         supplier_name,
         challan_no,
         quality_status,
         bill_status,
         receipt_date
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, item_id, received_by, quantity_received, supplier_name, challan_no, quality_status, bill_status, receipt_date`,
      [itemId, receivedBy, quantityReceived, supplierName, challanNo, qualityStatus, billStatus, receiptDate],
    );

    const stockResult = await client.query(
      `UPDATE items
       SET current_stock = current_stock + $2
       WHERE id = $1
       RETURNING id, current_stock`,
      [itemId, quantityReceived],
    );

    await client.query('COMMIT');

    return {
      receipt: receiptResult.rows[0],
      stock: stockResult.rows[0],
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listItemReceipts() {
  const result = await pool.query(
    `SELECT
       r.id,
       r.item_id,
       i.name AS item_name,
       c.id AS category_id,
       c.name AS category_name,
       r.received_by,
       u.name AS received_by_name,
       r.quantity_received,
       r.supplier_name,
       r.challan_no,
       r.quality_status,
       r.bill_status,
       r.receipt_date
     FROM item_receipts r
     INNER JOIN items i ON i.id = r.item_id
     LEFT JOIN item_categories c ON c.id = i.category_id
     LEFT JOIN users u ON u.id = r.received_by
     ORDER BY r.receipt_date DESC, r.id DESC`,
  );

  return result.rows;
}

module.exports = {
  findDefaultReceiverId,
  createItemReceiptAndUpdateStock,
  listItemReceipts,
};
