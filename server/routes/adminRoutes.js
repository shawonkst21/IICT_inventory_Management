const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const {
  getAdminTenderNotices,
  createAdminTenderNotice,
  updateAdminTenderNotice,
  deleteAdminTenderNotice,
} = require('../controllers/tenderController');

const router = express.Router();

router.get('/logs', getAuditLogs);
router.get('/tenders', getAdminTenderNotices);
router.post('/tenders', createAdminTenderNotice);
router.patch('/tenders/:id', updateAdminTenderNotice);
router.delete('/tenders/:id', deleteAdminTenderNotice);

module.exports = router;
