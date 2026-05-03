const { pool } = require('../config/db');
const {
  getItemOptions,
  listAdminItems: fetchAdminItems,
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
} = require('../models/itemModel');
const { logAuditAction } = require('../models/auditModel');

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNonNegativeInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeText(value) {
  return String(value || '').trim();
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
    const result = await pool.query(`SELECT id, name FROM item_categories ORDER BY name ASC`);

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

async function listAdminCategories(req, res) {
  try {
    const search = normalizeText(req.query.search);
    const categories = await listCategories(search);

    res.status(200).json({
      ok: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
}

async function createAdminCategory(req, res) {
  const name = normalizeText(req.body.name);
  const description = normalizeText(req.body.description);

  if (!name) {
    return res.status(400).json({
      ok: false,
      message: 'Category name is required',
    });
  }

  try {
    const existing = await findCategoryByName(name);
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: 'This category already exists',
      });
    }

    const created = await createCategory({
      name,
      description: description || null,
    });

    await logAuditAction({
      userId: req.user?.id,
      action: 'CREATE',
      tableName: 'item_categories',
      recordId: created.id,
      details: `Created category: ${name}`,
    });

    res.status(201).json({
      ok: true,
      message: 'Category created successfully',
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
}

async function updateAdminCategory(req, res) {
  const categoryId = parsePositiveInt(req.params.id);
  const name = normalizeText(req.body.name);
  const description = normalizeText(req.body.description);

  if (!categoryId) {
    return res.status(400).json({
      ok: false,
      message: 'Category id must be a positive integer',
    });
  }

  if (!name) {
    return res.status(400).json({
      ok: false,
      message: 'Category name is required',
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

    const existing = await findCategoryByName(name, categoryId);
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: 'This category already exists',
      });
    }

    const updated = await updateCategory({
      id: categoryId,
      name,
      description: description || null,
    });

    await logAuditAction({
      userId: req.user?.id,
      action: 'UPDATE',
      tableName: 'item_categories',
      recordId: categoryId,
      details: `Updated category: ${name}`,
    });

    res.status(200).json({
      ok: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to update category',
      error: error.message,
    });
  }
}

async function deleteAdminCategory(req, res) {
  const categoryId = parsePositiveInt(req.params.id);

  if (!categoryId) {
    return res.status(400).json({
      ok: false,
      message: 'Category id must be a positive integer',
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

    await deleteCategory(categoryId);

    await logAuditAction({
      userId: req.user?.id,
      action: 'DELETE',
      tableName: 'item_categories',
      recordId: categoryId,
      details: `Deleted category: ${category.name}`,
    });

    res.status(200).json({
      ok: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    const isForeignKeyError = error.code === '23503';
    res.status(isForeignKeyError ? 409 : 500).json({
      ok: false,
      message: isForeignKeyError
        ? 'This category is in use and cannot be deleted'
        : 'Failed to delete category',
      error: error.message,
    });
  }
}

async function listAdminItems(req, res) {
  try {
    const search = normalizeText(req.query.search);
    const items = await fetchAdminItems(search);

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

async function createAdminItem(req, res) {
  const { categoryId, name, description, unit, currentStock, lowStockThreshold } = req.body;

  const parsedCategoryId = parsePositiveInt(categoryId);
  const parsedCurrentStock = parseNonNegativeInt(currentStock);
  const parsedLowStockThreshold = parseNonNegativeInt(lowStockThreshold);
  const normalizedName = normalizeText(name);
  const normalizedUnit = normalizeText(unit);

  if (!parsedCategoryId || !normalizedName || !normalizedUnit) {
    return res.status(400).json({
      ok: false,
      message: 'categoryId, name and unit are required',
    });
  }

  if (parsedCurrentStock === null || parsedLowStockThreshold === null) {
    return res.status(400).json({
      ok: false,
      message: 'currentStock and lowStockThreshold must be integers greater than or equal to 0',
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

    const duplicate = await findItemByName(normalizedName);
    if (duplicate) {
      return res.status(409).json({
        ok: false,
        message: 'An item with this name already exists',
      });
    }

    const created = await createItem({
      categoryId: parsedCategoryId,
      name: normalizedName,
      description: normalizeText(description) || null,
      unit: normalizedUnit,
      currentStock: parsedCurrentStock,
      lowStockThreshold: parsedLowStockThreshold,
    });

    await logAuditAction({
      userId: req.user?.id,
      action: 'CREATE',
      tableName: 'items',
      recordId: created.id,
      details: `Created item: ${normalizedName}`,
    });

    res.status(201).json({
      ok: true,
      message: 'Item created successfully',
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to create item',
      error: error.message,
    });
  }
}

async function updateAdminItem(req, res) {
  const itemId = parsePositiveInt(req.params.id);
  const { categoryId, name, description, unit, currentStock, lowStockThreshold } = req.body;

  const parsedCategoryId = parsePositiveInt(categoryId);
  const parsedCurrentStock = parseNonNegativeInt(currentStock);
  const parsedLowStockThreshold = parseNonNegativeInt(lowStockThreshold);
  const normalizedName = normalizeText(name);
  const normalizedUnit = normalizeText(unit);

  if (!itemId) {
    return res.status(400).json({
      ok: false,
      message: 'Item id must be a positive integer',
    });
  }

  if (!parsedCategoryId || !normalizedName || !normalizedUnit) {
    return res.status(400).json({
      ok: false,
      message: 'categoryId, name and unit are required',
    });
  }

  if (parsedCurrentStock === null || parsedLowStockThreshold === null) {
    return res.status(400).json({
      ok: false,
      message: 'currentStock and lowStockThreshold must be integers greater than or equal to 0',
    });
  }

  try {
    const item = await findItemById(itemId);

    if (!item) {
      return res.status(404).json({
        ok: false,
        message: 'Item not found',
      });
    }

    const category = await findCategoryById(parsedCategoryId);

    if (!category) {
      return res.status(404).json({
        ok: false,
        message: 'Category not found',
      });
    }

    const duplicate = await findItemByName(normalizedName, itemId);
    if (duplicate) {
      return res.status(409).json({
        ok: false,
        message: 'An item with this name already exists',
      });
    }

    const updated = await updateItem({
      id: itemId,
      categoryId: parsedCategoryId,
      name: normalizedName,
      description: normalizeText(description) || null,
      unit: normalizedUnit,
      currentStock: parsedCurrentStock,
      lowStockThreshold: parsedLowStockThreshold,
    });

    await logAuditAction({
      userId: req.user?.id,
      action: 'UPDATE',
      tableName: 'items',
      recordId: itemId,
      details: `Updated item: ${normalizedName}`,
    });

    res.status(200).json({
      ok: true,
      message: 'Item updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to update item',
      error: error.message,
    });
  }
}

async function deleteAdminItem(req, res) {
  const itemId = parsePositiveInt(req.params.id);

  if (!itemId) {
    return res.status(400).json({
      ok: false,
      message: 'Item id must be a positive integer',
    });
  }

  try {
    const item = await findItemById(itemId);

    if (!item) {
      return res.status(404).json({
        ok: false,
        message: 'Item not found',
      });
    }

    await deleteItem(itemId);

    await logAuditAction({
      userId: req.user?.id,
      action: 'DELETE',
      tableName: 'items',
      recordId: itemId,
      details: `Deleted item: ${item.name}`,
    });

    res.status(200).json({
      ok: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    const isForeignKeyError = error.code === '23503';
    res.status(isForeignKeyError ? 409 : 500).json({
      ok: false,
      message: isForeignKeyError
        ? 'This item is in use and cannot be deleted'
        : 'Failed to delete item',
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
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  listAdminItems,
  createAdminItem,
  updateAdminItem,
  deleteAdminItem,
};
