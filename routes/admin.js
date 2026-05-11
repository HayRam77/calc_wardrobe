const express = require('express');
const router = express.Router();
const pool = require('../db');
const isAdmin = require('../middleware/isAdmin');
const bcrypt = require('bcryptjs');

router.use(isAdmin);

router.get('/users', async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT u.id, u.username, u.role, u.is_blocked, u.created_at,
        (SELECT COUNT(*) FROM projects WHERE user_id = u.id) AS project_count,
        (SELECT login_time FROM user_sessions WHERE user_id = u.id ORDER BY login_time DESC LIMIT 1) AS last_login
      FROM users u ORDER BY u.id
    `);
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await pool.query('SELECT id, username, role, is_blocked, created_at FROM users WHERE id = $1', [req.params.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    const projects = await pool.query('SELECT id, name, voltage, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [req.params.id]);
    const sessions = await pool.query('SELECT login_time, logout_time FROM user_sessions WHERE user_id = $1 ORDER BY login_time DESC LIMIT 20', [req.params.id]);
    res.json({ ...user.rows[0], projects: projects.rows, sessions: sessions.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.userId) {
    return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  }
  try {
    // Проверяем роль целевого пользователя
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [targetId]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.rows[0].role === 'admin') {
      return res.status(403).json({ error: 'Нельзя удалить администратора' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/block', async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.userId) {
    return res.status(400).json({ error: 'Нельзя заблокировать самого себя' });
  }
  try {
    const user = await pool.query('SELECT is_blocked FROM users WHERE id = $1', [targetId]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    const newState = !user.rows[0].is_blocked;
    await pool.query('UPDATE users SET is_blocked = $1 WHERE id = $2', [newState, targetId]);
    res.json({ is_blocked: newState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Новый пароль должен быть не менее 4 символов' });
  }
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Все шкафы (админ)
router.get('/cabinets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.name AS cabinet_name, p.name AS project_name, p.id AS project_id,
             u.username AS creator, c.created_at
      FROM cabinets c
      JOIN projects p ON c.project_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить конкретный шкаф (админ)
router.get('/cabinets/:id', async (req, res) => {
  try {
    const cabinet = await pool.query(`
      SELECT c.*, p.name AS project_name, p.id AS project_id,
             u.username AS creator
      FROM cabinets c
      JOIN projects p ON c.project_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (cabinet.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });

    const blocks = await pool.query(`
      SELECT pb.*, 
             (SELECT json_agg(json_build_object('param_name', pbp.param_name, 'param_value', pbp.param_value))
              FROM project_block_params pbp WHERE pbp.project_block_id = pb.id) AS parameters
      FROM project_blocks pb
      WHERE pb.cabinet_id = $1
      ORDER BY pb.order_index
    `, [req.params.id]);

    const result = {
      ...cabinet.rows[0],
      blocks: blocks.rows.map(b => ({
        ...b,
        parameters: b.parameters || []
      }))
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
