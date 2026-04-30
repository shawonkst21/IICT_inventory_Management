const express = require('express');
const { submitItemRequest } = require('../controllers/itemRequestController');

const router = express.Router();

router.post('/', submitItemRequest);

module.exports = router;
