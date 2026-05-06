const express = require('express');
const router = express.Router();
const pool = require('../db');
const isAdmin = require('../middleware/isAdmin');
const bcrypt = require('bcryptjs');

router.use(isAdmin);

// Список всех пользователей
router.get('/users', async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT u.id, u.username, u.role, u.is_blocked, u.created_at,
        (SELECT COUNT(*) FROM projects WHERE user_id = u.id) AS project_count,
        (SELECT login_time FROM user_sessions WHERE user_id = u.id ORDER BY login_time DESC LIMIT 1) AS last_login
      FROM users u
      ORDER BY u.id
    `);
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Детальная информация о пользователе
router.get('/users/:id', async (req, res) => {
  try {
    const user = await pool.query('SELECT id, username, role, is_blocked, created_at FROM users WHERE id = $1', [req.params.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });

    // Проекты пользователя (с датой создания)
    const projects = await pool.query('SELECT id, name, voltage, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [req.params.id]);
    
    // Сессии
    const sessions = await pool.query(
      'SELECT login_time, logout_time FROM user_sessions WHERE user_id = $1 ORDER BY login_time DESC LIMIT 20',
      [req.params.id]
    );
    res.json({ ...user.rows[0], projects: projects.rows, sessions: sessions.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удаление пользователя
router.delete('/users/:id', async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.userId) return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  try {
    // Проекты пользователя не удаляем, они останутся с user_id = NULL (по CASCADE SET NULL)
    await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Блокировка/разблокировка
router.post('/users/:id/block', async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.userId) return res.status(400).json({ error: 'Нельзя заблокировать самого себя' });
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

// Сброс пароля
router.post('/users/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Новый пароль должен быть не менее 4 символов' });
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
