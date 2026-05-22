const fs = require('fs');
const path = require('path');
const createScriptPool = require('./scriptPool');
require('dotenv').config();

async function resetDatabase() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Add it to backend/express-server/.env first.');
  }

  const pool = createScriptPool(connectionString);
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  await pool.query(`
    DROP TABLE IF EXISTS
      tasks,
      project_members,
      password_reset_tokens,
      refresh_tokens,
      projects,
      users,
      app_users
    CASCADE;
  `);

  await pool.query(schemaSql);
  await pool.end();
}

resetDatabase()
  .then(() => {
    console.log('Database reset complete. Current schema has been applied.');
  })
  .catch((error) => {
    console.error(`Database reset failed: ${error.message}`);
    process.exit(1);
  });
