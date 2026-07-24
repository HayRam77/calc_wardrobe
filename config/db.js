const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'hrroot',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bd_calc',
  password: process.env.DB_PASSWORD || 'CalcWardrobe2026!',
  port: process.env.DB_PORT || 5432,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Сбой в пуле подключений PostgreSQL:', err);
});

module.exports = pool;
