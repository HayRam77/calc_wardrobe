const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET – список всех параметров (справочник)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parameters ORDER BY param_name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST – создать новый параметр (только админ, но на первый раз пусть будет доступен всем авторизованным)
router.post('/', async (req, res) => {
  const { param_name } = req.body;
  if (!param_name || !param_name.trim()) return res.status(400).json({ error: 'Название параметра обязательно' });
  try {
    const result = await pool.query(
      'INSERT INTO parameters (param_name) VALUES ($1) RETURNING *',
      [param_name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Параметр уже существует' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
