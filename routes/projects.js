const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Создать проект
router.post('/', async (req, res) => {
  const { name, voltage } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя проекта обязательно' });
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, voltage, simultaneity_factor) VALUES ($1, $2, $3) RETURNING *`,
      [name, voltage || '380', 0.9]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Список проектов (можно фильтровать, пока все)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить один проект
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Проект не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить проект (пока не используется, но оставим)
router.put('/:id', async (req, res) => {
  const { name, voltage, simultaneity_factor } = req.body;
  try {
    const result = await pool.query(
      `UPDATE projects SET name = COALESCE($1, name), voltage = COALESCE($2, voltage), simultaneity_factor = COALESCE($3, simultaneity_factor), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [name, voltage, simultaneity_factor, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Проект не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить проект
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
