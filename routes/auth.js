const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// Регистрация
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
    
    // Проверка блокировки
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Пользователь заблокирован' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Создаём сессию
    const session = await pool.query(
      'INSERT INTO user_sessions (user_id) VALUES ($1) RETURNING id',
      [user.id]
    );
    const sessionId = session.rows[0].id;

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      sessionId,            // <-- передаём для логаута
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Выход (закрываем сессию)
router.post('/logout', async (req, res) => {
  const { sessionId } = req.body;
  try {
    if (sessionId) {
      // Закрываем конкретную сессию
      await pool.query(
        'UPDATE user_sessions SET logout_time = CURRENT_TIMESTAMP WHERE id = $1 AND logout_time IS NULL',
        [sessionId]
      );
    } else {
      // Если sessionId не передан, закрываем все открытые сессии пользователя (по userId из токена? нет, без токена нельзя, но можно не трогать)
      return res.status(400).json({ error: 'sessionId не передан' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
