const { pool } = require('../config/db');
const {
  getItemOptions,
  getItemOptionsByCategory,
  findCategoryById,
  createItem,
} = require('../models/itemModel');

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function listItemOptions(_req, res) {
  try {
    const items = await getItemOptions();

    res.status(200).json({
      ok: true,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch items',
      error: error.message,
    });
  }
}

async function getStockLevels(req, res) {
  try {
    const { itemName, categoryId, status } = req.query;

    let query = `
      SELECT 
        i.id,
        i.name AS item_name,
        ic.id AS category_id,
        ic.name AS category_name,
        i.unit,
        i.current_stock AS quantity,
        i.low_stock_threshold,
        CASE 
          WHEN i.current_stock = 0 THEN 'not_available'
          WHEN i.current_stock < i.low_stock_threshold THEN 'low'
          ELSE 'available'
        END AS stock_status
      FROM items i
      LEFT JOIN item_categories ic ON i.category_id = ic.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (itemName) {
      query += ` AND LOWER(i.name) LIKE LOWER($${paramCount})`;
      params.push(`%${itemName}%`);
      paramCount++;
    }

    if (categoryId) {
      query += ` AND ic.id = $${paramCount}`;
      params.push(categoryId);
      paramCount++;
    }

    if (status) {
      if (status === 'not_available') {
        query += ` AND i.current_stock = 0`;
      } else if (status === 'low') {
        query += ` AND i.current_stock > 0 AND i.current_stock < i.low_stock_threshold`;
      } else if (status === 'available') {
        query += ` AND i.current_stock >= i.low_stock_threshold`;
      }
    }

    query += ` ORDER BY i.name ASC`;

    const result = await pool.query(query, params);

    res.status(200).json({
      ok: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch stock levels',
      error: error.message,
    });
  }
}

async function getCategories(_req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name FROM item_categories ORDER BY name ASC`
    );

    res.status(200).json({
      ok: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
}

async function listItemOptionsByCategory(req, res) {
  const categoryId = parsePositiveInt(req.query.categoryId);

  if (!categoryId) {
    return res.status(400).json({
      ok: false,
      message: 'categoryId must be a positive integer',
    });
  }

  try {
    const category = await findCategoryById(categoryId);

    if (!category) {
      return res.status(404).json({
        ok: false,
        message: 'Category not found',
      });
    }

    const items = await getItemOptionsByCategory(categoryId);

    res.status(200).json({
      ok: true,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch items for category',
      error: error.message,
    });
  }
}

async function createNewItem(req, res) {
  const { categoryId, name, description, unit, currentStock, lowStockThreshold } = req.body;

  const parsedCategoryId = parsePositiveInt(categoryId);
  const parsedCurrentStock = Number.parseInt(String(currentStock), 10);
  const parsedLowStockThreshold = Number.parseInt(String(lowStockThreshold), 10);

  if (!parsedCategoryId || !String(name || '').trim() || !String(unit || '').trim()) {
    return res.status(400).json({
      ok: false,
      message: 'categoryId, name and unit are required',
    });
  }

  if (!Number.isInteger(parsedCurrentStock) || parsedCurrentStock < 0) {
    return res.status(400).json({
      ok: false,
      message: 'currentStock must be an integer greater than or equal to 0',
    });
  }

  if (!Number.isInteger(parsedLowStockThreshold) || parsedLowStockThreshold < 0) {
    return res.status(400).json({
      ok: false,
      message: 'lowStockThreshold must be an integer greater than or equal to 0',
    });
  }

  try {
    const category = await findCategoryById(parsedCategoryId);

    if (!category) {
      return res.status(404).json({
        ok: false,
        message: 'Category not found',
      });
    }

    const created = await createItem({
      categoryId: parsedCategoryId,
      name: String(name).trim(),
      description: String(description || '').trim() || null,
      unit: String(unit).trim(),
      currentStock: parsedCurrentStock,
      lowStockThreshold: parsedLowStockThreshold,
    });

    res.status(201).json({
      ok: true,
      message: 'Item created successfully',
      data: created,
    });
  } catch (error) {
    const isDuplicate = error.code === '23505';
    res.status(isDuplicate ? 409 : 500).json({
      ok: false,
      message: isDuplicate ? 'An item with this name already exists' : 'Failed to create item',
      error: error.message,
    });
  }
}

module.exports = {
  listItemOptions,
  getStockLevels,
  getCategories,
  listItemOptionsByCategory,
  createNewItem,
};
