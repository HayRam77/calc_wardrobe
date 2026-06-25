const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.use(authMiddleware);

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Доступ запрещён' });
}

// Получить всех пользователей
router.get('/users', isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, is_blocked, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Заблокировать/разблокировать пользователя
router.post('/users/:id/block', isAdmin, async (req, res) => {
  try {
    const { is_blocked } = req.body;
    const result = await pool.query(
      'UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, username, is_blocked',
      [is_blocked, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Сброс пароля пользователя
router.post('/users/:id/reset-password', isAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) return res.status(400).json({ error: 'Пароль должен быть минимум 4 символа' });
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить пользователя
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.rows[0].role === 'admin') return res.status(403).json({ error: 'Нельзя удалить администратора' });
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;