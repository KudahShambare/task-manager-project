const express = require('express');
const app = express();
const pool = require('./db');

app.use(express.json());

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Database connected successfully',
      time: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      message: 'Database connection failed',
      error: err.message
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});