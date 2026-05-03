const { listAuditLogs } = require('../models/auditModel');

async function getAuditLogs(req, res) {
  try {
    const { search, action, tableName, fromDate, toDate } = req.query;
    const logs = await listAuditLogs({
      search: search ? String(search).trim() : undefined,
      action: action ? String(action).trim() : undefined,
      tableName: tableName ? String(tableName).trim() : undefined,
      fromDate: fromDate ? String(fromDate).trim() : undefined,
      toDate: toDate ? String(toDate).trim() : undefined,
      limit: 500,
    });

    return res.status(200).json({ ok: true, data: logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAuditLogs,
};
