const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Создать проект
router.post('/', async (req, res) => {
  const { name, voltage, remark } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя проекта обязательно' });
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, voltage, simultaneity_factor, user_id, remark)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, voltage || '380', 0.9, req.user.userId, remark || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Проект с таким именем уже существует' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Список проектов
router.get('/', async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? 'SELECT p.*, u.username as created_by FROM projects p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.updated_at DESC'
      : 'SELECT p.*, u.username as created_by FROM projects p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id = $1 ORDER BY p.updated_at DESC';
    const params = req.user.role === 'admin' ? [] : [req.user.userId];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить один проект
router.get('/:id', async (req, res) => {
  try {
    let query;
    let params;
    if (req.user.role === 'admin') {
      query = `SELECT p.*, u.username as created_by FROM projects p 
               LEFT JOIN users u ON p.user_id = u.id 
               WHERE p.id = $1`;
      params = [req.params.id];
    } else {
      query = `SELECT p.*, u.username as created_by FROM projects p 
               LEFT JOIN users u ON p.user_id = u.id 
               WHERE p.id = $1 AND p.user_id = $2`;
      params = [req.params.id, req.user.userId];
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Проект не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить проект
router.put('/:id', async (req, res) => {
  const { name, voltage, simultaneity_factor, remark } = req.body;
  try {
    const query = req.user.role === 'admin'
      ? `UPDATE projects SET name = COALESCE($1, name), voltage = COALESCE($2, voltage), 
         simultaneity_factor = COALESCE($3, simultaneity_factor), remark = COALESCE($4, remark),
         updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *`
      : `UPDATE projects SET name = COALESCE($1, name), voltage = COALESCE($2, voltage), 
         simultaneity_factor = COALESCE($3, simultaneity_factor), remark = COALESCE($4, remark),
         updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING *`;
    const params = req.user.role === 'admin'
      ? [name, voltage, simultaneity_factor, remark, req.params.id]
      : [name, voltage, simultaneity_factor, remark, req.params.id, req.user.userId];
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Проект не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Проект с таким именем уже существует' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Удалить проект
router.delete('/:id', async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? 'DELETE FROM projects WHERE id = $1'
      : 'DELETE FROM projects WHERE id = $1 AND user_id = $2';
    const params = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.userId];
    await pool.query(query, params);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
