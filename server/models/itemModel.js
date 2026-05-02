const { pool } = require('../config/db');

async function getItemOptions() {
  const result = await pool.query('SELECT id, name FROM items ORDER BY name ASC');
  return result.rows;
}

async function listAdminItems(search = '') {
  const params = [];
  let query = `
    SELECT
      i.id,
      i.category_id,
      ic.name AS category_name,
      i.name,
      i.description,
      i.unit,
      i.current_stock,
      i.low_stock_threshold
    FROM items i
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    WHERE 1=1
  `;

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (LOWER(i.name) LIKE LOWER($${params.length}) OR LOWER(COALESCE(ic.name, '')) LIKE LOWER($${params.length}))`;
  }

  query += ' ORDER BY i.name ASC';

  const result = await pool.query(query, params);
  return result.rows;
}

async function listCategories(search = '') {
  const params = [];
  let query = 'SELECT id, name, description FROM item_categories WHERE 1=1';

  if (search) {
    params.push(`%${search}%`);
    query += ` AND LOWER(name) LIKE LOWER($${params.length})`;
  }

  query += ' ORDER BY name ASC';

  const result = await pool.query(query, params);
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
  const result = await pool.query('SELECT id, name, description FROM item_categories WHERE id = $1', [categoryId]);
  return result.rows[0] || null;
}

async function findCategoryByName(name, excludeId = null) {
  const params = [String(name).trim()];
  let query = 'SELECT id, name, description FROM item_categories WHERE LOWER(name) = LOWER($1)';

  if (excludeId) {
    params.push(excludeId);
    query += ' AND id <> $2';
  }

  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

async function findItemById(itemId) {
  const result = await pool.query(
    'SELECT id, category_id, name, description, unit, current_stock, low_stock_threshold FROM items WHERE id = $1',
    [itemId],
  );
  return result.rows[0] || null;
}

async function findItemByName(name, excludeId = null) {
  const params = [String(name).trim()];
  let query = 'SELECT id, name FROM items WHERE LOWER(name) = LOWER($1)';

  if (excludeId) {
    params.push(excludeId);
    query += ' AND id <> $2';
  }

  const result = await pool.query(query, params);
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

async function updateItem({ id, categoryId, name, description, unit, currentStock, lowStockThreshold }) {
  const result = await pool.query(
    `UPDATE items
     SET category_id = $1,
         name = $2,
         description = $3,
         unit = $4,
         current_stock = $5,
         low_stock_threshold = $6
     WHERE id = $7
     RETURNING id, category_id, name, description, unit, current_stock, low_stock_threshold`,
    [categoryId, name, description, unit, currentStock, lowStockThreshold, id],
  );

  return result.rows[0] || null;
}

async function deleteItem(itemId) {
  const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [itemId]);
  return result.rows[0] || null;
}

async function createCategory({ name, description }) {
  const result = await pool.query(
    'INSERT INTO item_categories (name, description) VALUES ($1, $2) RETURNING id, name, description',
    [name, description],
  );

  return result.rows[0];
}

async function updateCategory({ id, name, description }) {
  const result = await pool.query(
    'UPDATE item_categories SET name = $1, description = $2 WHERE id = $3 RETURNING id, name, description',
    [name, description, id],
  );

  return result.rows[0] || null;
}

async function deleteCategory(categoryId) {
  const result = await pool.query('DELETE FROM item_categories WHERE id = $1 RETURNING id', [categoryId]);
  return result.rows[0] || null;
}

module.exports = {
  getItemOptions,
  listAdminItems,
  listCategories,
  getItemOptionsByCategory,
  findCategoryById,
  findCategoryByName,
  findItemById,
  findItemByName,
  createItem,
  updateItem,
  deleteItem,
  createCategory,
  updateCategory,
  deleteCategory,
};
