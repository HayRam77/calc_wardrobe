const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validation');

router.post('/register', rules.auth.register, validate, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Пользователь с таким именем или email уже существует' });
        }
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, password_hash, 'user']
        );
        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.status(201).json({ message: 'Регистрация успешна', user: { id: user.id, username: user.username, email: user.email, role: user.role }, token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Ошибка регистрации' });
    }
});

router.post('/login', rules.auth.login, validate, async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        await pool.query('INSERT INTO user_sessions (user_id, token) VALUES ($1, $2)', [user.id, token]);
        res.json({ message: 'Вход выполнен', user: { id: user.id, username: user.username, email: user.email, role: user.role }, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка входа' });
    }
});

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        await pool.query('DELETE FROM user_sessions WHERE token = $1', [token]);
        res.json({ message: 'Выход выполнен' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Ошибка выхода' });
    }
});

router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Ошибка проверки' });
    }
});

module.exports = router;
