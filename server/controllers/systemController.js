const { testDatabaseConnection } = require('../config/db');

async function getHealth(_req, res) {
  try {
    const dbTime = await testDatabaseConnection();

    res.status(200).json({
      ok: true,
      message: 'Server and database are reachable',
      dbTime,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Database check failed',
      error: error.message,
    });
  }
}

function getRoot(_req, res) {
  res.status(200).json({
    ok: true,
    message: 'IICT backend is running',
  });
}

module.exports = {
  getHealth,
  getRoot,
};
