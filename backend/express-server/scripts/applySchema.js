const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function applySchema() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Add it to backend/express-server/.env first.');
  }

  const pool = new Pool({ connectionString });
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  await pool.query(schemaSql);
  await pool.end();
}

applySchema()
  .then(() => {
    console.log('Database schema applied without dropping existing data.');
  })
  .catch((error) => {
    console.error(`Database schema apply failed: ${error.message}`);
    process.exit(1);
  });
