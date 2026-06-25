const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET — проекты текущего пользователя
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, voltage, simultaneity_factor, created_at, updated_at, remark FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /all — все проекты (только админ)
router.get('/all', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.voltage, p.simultaneity_factor, p.created_at, p.updated_at, p.remark,
              u.username AS owner
       FROM projects p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — создать проект
router.post('/', async (req, res) => {
  const { name, voltage, simultaneity_factor, remark } = req.body;
  if (!name) return res.status(400).json({ error: 'Название проекта обязательно' });
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, voltage, simultaneity_factor, remark, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, voltage || '380', simultaneity_factor || 0.9, remark || null, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT — обновить проект
router.put('/:id', async (req, res) => {
  const { name, voltage, simultaneity_factor, remark } = req.body;
  try {
    const check = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Проект не найден' });
    const result = await pool.query(
      'UPDATE projects SET name=$1, voltage=$2, simultaneity_factor=$3, remark=$4, updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *',
      [name, voltage, simultaneity_factor, remark, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE — удалить проект
router.delete('/:id', async (req, res) => {
  try {
    const check = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Проект не найден' });
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;