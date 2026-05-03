const express = require('express');
const { getPublishedTenderNotices } = require('../controllers/tenderController');

const router = express.Router();

router.get('/', getPublishedTenderNotices);

module.exports = router;
