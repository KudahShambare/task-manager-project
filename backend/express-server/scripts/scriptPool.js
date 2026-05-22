const { Pool } = require('pg');

function createScriptPool(connectionString) {
  return new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
}

module.exports = createScriptPool;
