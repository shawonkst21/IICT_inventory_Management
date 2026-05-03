const { Pool } = require('pg');

// Use connection string if provided, otherwise fall back to individual params
function getDatabaseConnectionInfo() {
  if (process.env.DATABASE_URL) {
    const parsedUrl = new URL(process.env.DATABASE_URL);
    const isSupabase = parsedUrl.hostname.includes('supabase.com');

    return {
      mode: isSupabase ? 'supabase' : 'connection-string',
      host: parsedUrl.hostname,
      port: parsedUrl.port || '5432',
      database: parsedUrl.pathname.replace(/^\//, '') || 'postgres',
    };
  }

  return {
    mode: 'local',
    host: process.env.IICT_PGHOST || '127.0.0.1',
    port: process.env.IICT_PGPORT || '5432',
    database: process.env.IICT_PGDATABASE || 'postgres',
  };
}

const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for Supabase Pooler
    }
  : {
      host: process.env.IICT_PGHOST || '127.0.0.1',
      port: Number.parseInt(process.env.IICT_PGPORT || '5432', 10),
      user: process.env.IICT_PGUSER || 'postgres',
      password:
        process.env.IICT_PGPASSWORD === undefined
          ? ''
          : String(process.env.IICT_PGPASSWORD),
      database: process.env.IICT_PGDATABASE || 'postgres',
      ssl:
        (process.env.IICT_DATABASE_SSL || 'false').toLowerCase() === 'true'
          ? { rejectUnauthorized: false }
          : false,
    };

const pool = new Pool(dbConfig);

async function testDatabaseConnection() {
  const result = await pool.query('SELECT NOW() AS now');
  return result.rows[0].now;
}

module.exports = {
  pool,
  testDatabaseConnection,
  getDatabaseConnectionInfo,
};
