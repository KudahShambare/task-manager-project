const { createApp } = require('./src/app');
const env = require('./src/config/env');
const pool = require('./src/db/pool');
const { createPostgresStore } = require('./src/db/postgresStore');

const app = createApp({
  store: createPostgresStore(pool),
  env,
});

app.listen(env.port, () => {
  console.log(`Task Manager API running on port ${env.port}`);
});
