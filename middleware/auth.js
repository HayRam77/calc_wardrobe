const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

// Регистрация
router.post('/register', validate([
  body('username').trim().notEmpty().withMessage('Имя пользователя обязательно'),
  body('email').isEmail().normalizeEmail().withMessage('Введите корректный email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов')
]), async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Проверка существования пользователя
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email или именем уже существует' });
    }

    // Хеширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создание пользователя
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, 'user']
    );

    // Генерация токена
    const token = jwt.sign(
      { id: result.rows[0].id, role: result.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// Вход
router.post('/login', validate([
  body('email').isEmail().normalizeEmail().withMessage('Введите корректный email'),
  body('password').notEmpty().withMessage('Пароль обязателен')
]), async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
});

// Смена пароля (только для авторизованных)
router.put('/password', auth, validate([
  body('currentPassword').notEmpty().withMessage('Текущий пароль обязателен'),
  body('newPassword').isLength({ min: 6 }).withMessage('Новый пароль должен содержать минимум 6 символов')
]), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Текущий пароль неверен' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);
    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при смене пароля' });
  }
});

// Проверка токена и получение данных пользователя (для клиента)
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;