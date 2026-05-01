const express = require('express');
const {
	getItemRequests,
	submitItemRequest,
	updateItemRequestReview,
	issueItemRequest,
} = require('../controllers/itemRequestController');

const router = express.Router();

router.get('/', getItemRequests);
router.post('/', submitItemRequest);
router.patch('/:requestId/review', updateItemRequestReview);
router.post('/:requestId/issue', issueItemRequest);

module.exports = router;
