const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Получить все корпуса
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, description FROM enclosures ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить новый корпус
router.post('/', authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Название корпуса обязательно' });
  }
  try {
    const existing = await pool.query('SELECT id FROM enclosures WHERE name = $1', [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Корпус с таким названием уже существует' });
    }
    const result = await pool.query(
      'INSERT INTO enclosures (name, description, created_by) VALUES ($1, $2, $3) RETURNING id, name, description',
      [name.trim(), description || null, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
