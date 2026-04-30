const { pool } = require('../config/db');

async function getItemOptions() {
  const result = await pool.query('SELECT id, name FROM items ORDER BY name ASC');
  return result.rows;
}

async function findItemById(itemId) {
  const result = await pool.query('SELECT id FROM items WHERE id = $1', [itemId]);
  return result.rows[0] || null;
}

module.exports = {
  getItemOptions,
  findItemById,
};
