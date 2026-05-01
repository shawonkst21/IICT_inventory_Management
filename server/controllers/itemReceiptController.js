const { findItemById } = require('../models/itemModel');
const {
  findDefaultReceiverId,
  createItemReceiptAndUpdateStock,
  listItemReceipts,
} = require('../models/itemReceiptModel');

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidDateString(dateValue) {
  if (!dateValue || typeof dateValue !== 'string') {
    return false;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateValue)) {
    return false;
  }

  const date = new Date(`${dateValue}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

async function getItemReceipts(_req, res) {
  try {
    const receipts = await listItemReceipts();

    res.status(200).json({
      ok: true,
      data: receipts,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch item receipts',
      error: error.message,
    });
  }
}

async function createItemReceipt(req, res) {
  const {
    itemId,
    quantityReceived,
    supplierName,
    challanNo,
    qualityStatus,
    billStatus,
    receiptDate,
    receivedBy,
  } = req.body;

  const parsedItemId = parsePositiveInt(itemId);
  const parsedQuantityReceived = parsePositiveInt(quantityReceived);
  const parsedReceivedBy = receivedBy === undefined ? null : parsePositiveInt(receivedBy);
  const normalizedQualityStatus = String(qualityStatus || '').trim().toLowerCase();
  const normalizedBillStatus = String(billStatus || '').trim().toLowerCase();

  if (!parsedItemId || !parsedQuantityReceived) {
    return res.status(400).json({
      ok: false,
      message: 'itemId and quantityReceived must be positive integers',
    });
  }

  if (!String(supplierName || '').trim() || !String(challanNo || '').trim()) {
    return res.status(400).json({
      ok: false,
      message: 'supplierName and challanNo are required',
    });
  }

  if (!['good', 'partial', 'damaged', 'rejected'].includes(normalizedQualityStatus)) {
    return res.status(400).json({
      ok: false,
      message: "qualityStatus must be one of: good, partial, damaged, rejected",
    });
  }

  if (!['paid', 'pending', 'unpaid'].includes(normalizedBillStatus)) {
    return res.status(400).json({
      ok: false,
      message: "billStatus must be one of: paid, pending, unpaid",
    });
  }

  if (!isValidDateString(String(receiptDate || ''))) {
    return res.status(400).json({
      ok: false,
      message: 'receiptDate must be a valid date in YYYY-MM-DD format',
    });
  }

  if (receivedBy !== undefined && !parsedReceivedBy) {
    return res.status(400).json({
      ok: false,
      message: 'receivedBy must be a positive integer when provided',
    });
  }

  try {
    const item = await findItemById(parsedItemId);

    if (!item) {
      return res.status(404).json({
        ok: false,
        message: 'Item not found',
      });
    }

    const receiverId = parsedReceivedBy || (await findDefaultReceiverId());

    if (!receiverId) {
      return res.status(400).json({
        ok: false,
        message: 'No active user found to assign as receiver',
      });
    }

    const created = await createItemReceiptAndUpdateStock({
      itemId: parsedItemId,
      receivedBy: receiverId,
      quantityReceived: parsedQuantityReceived,
      supplierName: String(supplierName).trim(),
      challanNo: String(challanNo).trim(),
      qualityStatus: normalizedQualityStatus,
      billStatus: normalizedBillStatus,
      receiptDate: String(receiptDate).trim(),
    });

    res.status(201).json({
      ok: true,
      message: 'Item receipt recorded and stock updated',
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to record item receipt',
      error: error.message,
    });
  }
}

module.exports = {
  getItemReceipts,
  createItemReceipt,
};
