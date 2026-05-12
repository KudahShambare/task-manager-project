const express = require('express');
const app = express();
const pool = require('./db');

app.use(express.json());

app.get('/', async (req, res) => {
  const result = await pool.query('SELECT NOW()');
  res.json(result.rows);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});