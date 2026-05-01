const express = require('express');
const {
	listItemOptions,
	getStockLevels,
	getCategories,
	listItemOptionsByCategory,
	createNewItem,
} = require('../controllers/itemController');

const router = express.Router();

router.get('/options', listItemOptions);
router.get('/options/by-category', listItemOptionsByCategory);
router.get('/stock-levels', getStockLevels);
router.get('/categories', getCategories);
router.post('/', createNewItem);

module.exports = router;
