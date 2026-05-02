const express = require('express');
const {
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
} = require('../controllers/itemController');

const router = express.Router();

router.get('/options', listItemOptions);
router.get('/options/by-category', listItemOptionsByCategory);
router.get('/stock-levels', getStockLevels);
router.get('/categories', getCategories);
router.post('/', createNewItem);

router.get('/admin/categories', listAdminCategories);
router.post('/admin/categories', createAdminCategory);
router.patch('/admin/categories/:id', updateAdminCategory);
router.delete('/admin/categories/:id', deleteAdminCategory);

router.get('/admin/items', listAdminItems);
router.post('/admin/items', createAdminItem);
router.patch('/admin/items/:id', updateAdminItem);
router.delete('/admin/items/:id', deleteAdminItem);

module.exports = router;
