const { getItemOptions } = require('../models/itemModel');

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

module.exports = {
  listItemOptions,
};
