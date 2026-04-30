const express = require('express');
const { getHealth, getRoot } = require('../controllers/systemController');

const router = express.Router();

router.get('/health', getHealth);
router.get('/', getRoot);

module.exports = router;
