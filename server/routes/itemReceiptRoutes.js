const express = require('express');
const { getItemReceipts, createItemReceipt } = require('../controllers/itemReceiptController');

const router = express.Router();

router.get('/', getItemReceipts);
router.post('/', createItemReceipt);

module.exports = router;
