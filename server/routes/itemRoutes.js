const express = require('express');
const { listItemOptions } = require('../controllers/itemController');

const router = express.Router();

router.get('/options', listItemOptions);

module.exports = router;
