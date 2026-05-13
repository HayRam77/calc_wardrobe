const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// Регистрация (без изменений)
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Требуются имя пользователя и пароль' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, username, role",
      [username, hashed]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Вход
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }
    const user = result.rows[0];
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Пользователь заблокирован' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Создаём сессию с IP и User-Agent
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const session = await pool.query(
      'INSERT INTO user_sessions (user_id, ip_address, user_agent) VALUES ($1, $2, $3) RETURNING id, login_time',
      [user.id, ip, userAgent]
    );
    const { id: sessionId, login_time: loginTime } = session.rows[0];

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      sessionId,
      loginTime,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Выход
router.post('/logout', async (req, res) => {
  const { sessionId } = req.body;
  try {
    if (sessionId) {
      await pool.query(
        'UPDATE user_sessions SET logout_time = CURRENT_TIMESTAMP WHERE id = $1 AND logout_time IS NULL',
        [sessionId]
      );
    } else {
      return res.status(400).json({ error: 'sessionId не передан' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
