const { findItemById } = require('../models/itemModel');
const { createItemRequest } = require('../models/itemRequestModel');

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function submitItemRequest(req, res) {
  const { itemId, quantityRequested, department, purpose, recipientRoom } = req.body;

  if (!itemId || !quantityRequested || !department || !purpose || !recipientRoom) {
    return res.status(400).json({
      ok: false,
      message: 'itemId, quantityRequested, department, purpose and recipientRoom are required',
    });
  }

  const parsedItemId = parsePositiveInt(itemId);
  const parsedQuantity = parsePositiveInt(quantityRequested);

  if (!parsedItemId) {
    return res.status(400).json({
      ok: false,
      message: 'itemId must be a positive integer',
    });
  }

  if (!parsedQuantity) {
    return res.status(400).json({
      ok: false,
      message: 'quantityRequested must be a positive integer',
    });
  }

  try {
    const existingItem = await findItemById(parsedItemId);

    if (!existingItem) {
      return res.status(404).json({
        ok: false,
        message: 'Item not found',
      });
    }

    const createdRequest = await createItemRequest({
      itemId: parsedItemId,
      quantityRequested: parsedQuantity,
      department: String(department).trim(),
      purpose: String(purpose).trim(),
      recipientRoom: String(recipientRoom).trim(),
    });

    res.status(201).json({
      ok: true,
      message: 'Item request submitted successfully',
      data: createdRequest,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to submit item request',
      error: error.message,
    });
  }
}

module.exports = {
  submitItemRequest,
};
