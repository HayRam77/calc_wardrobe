const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Получить все шаблоны
router.get('/', async (req, res) => {
  try {
    const templates = await pool.query(
      'SELECT id, name, description, manufacturer, article, price, labor, created_by, created_at FROM block_templates ORDER BY name'
    );
    res.json(templates.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать шаблон
router.post('/', async (req, res) => {
  const { name, description, manufacturer, article, price, labor } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  try {
    const result = await pool.query(
      `INSERT INTO block_templates (name, description, manufacturer, article, price, labor, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description || null, manufacturer || null, article || null, price || null, labor || null, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Компонент с таким именем уже существует' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Обновить шаблон
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  const { name, description, manufacturer, article, price, labor } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  try {
    await pool.query(
      `UPDATE block_templates SET name=$1, description=$2, manufacturer=$3, article=$4, price=$5, labor=$6
       WHERE id=$7`,
      [name, description || null, manufacturer || null, article || null, price || null, labor || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Компонент с таким именем уже существует' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Удалить шаблон
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  try {
    await pool.query('DELETE FROM block_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
