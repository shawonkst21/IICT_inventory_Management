const { pool } = require('../config/db');

async function getItemOptions() {
  const result = await pool.query('SELECT id, name FROM items ORDER BY name ASC');
  return result.rows;
}

async function getItemOptionsByCategory(categoryId) {
  const result = await pool.query(
    'SELECT id, name FROM items WHERE category_id = $1 ORDER BY name ASC',
    [categoryId],
  );
  return result.rows;
}

async function findCategoryById(categoryId) {
  const result = await pool.query('SELECT id, name FROM item_categories WHERE id = $1', [categoryId]);
  return result.rows[0] || null;
}

async function findItemById(itemId) {
  const result = await pool.query('SELECT id, category_id, name, current_stock FROM items WHERE id = $1', [itemId]);
  return result.rows[0] || null;
}

async function createItem({ categoryId, name, description, unit, currentStock, lowStockThreshold }) {
  const result = await pool.query(
    `INSERT INTO items (category_id, name, description, unit, current_stock, low_stock_threshold)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, category_id, name, description, unit, current_stock, low_stock_threshold`,
    [categoryId, name, description, unit, currentStock, lowStockThreshold],
  );

  return result.rows[0];
}

module.exports = {
  getItemOptions,
  getItemOptionsByCategory,
  findCategoryById,
  findItemById,
  createItem,
};
