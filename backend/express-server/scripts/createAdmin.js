const bcrypt = require('bcryptjs');
const createScriptPool = require('./scriptPool');
require('dotenv').config();

async function createAdmin() {
  const connectionString = process.env.DATABASE_URL?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Add it to backend/express-server/.env first.');
  }

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  }

  const pool = createScriptPool(connectionString);
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await pool.query(
    'SELECT id FROM app_users WHERE lower(email) = lower($1)',
    [email],
  );

  const result = existing.rows[0]
    ? await pool.query(
      `
        UPDATE app_users
        SET name = $1, role = 'ADMIN', password_hash = $2
        WHERE id = $3
        RETURNING id, name, email, role
      `,
      [name, passwordHash, existing.rows[0].id],
    )
    : await pool.query(
      `
        INSERT INTO app_users (name, email, role, password_hash)
        VALUES ($1, $2, 'ADMIN', $3)
        RETURNING id, name, email, role
      `,
      [name, email, passwordHash],
    );

  await pool.end();

  const admin = result.rows[0];
  console.log(`Admin account ready: ${admin.email} (${admin.role})`);
}

createAdmin().catch((error) => {
  console.error(`Admin account setup failed: ${error.message}`);
  process.exit(1);
});
