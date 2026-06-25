const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// Middleware аутентификации (локально)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

// Middleware только для admin
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Доступ запрещён' });
    }
}

// Все роуты требуют авторизации
router.use(authenticateToken);

// GET — получить всех производителей (все авторизованные)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name FROM manufacturers ORDER BY name ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения производителей:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST — добавить производителя (только admin)
router.post('/', isAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Название обязательно' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO manufacturers (name) VALUES ($1) RETURNING id, name',
            [name.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Производитель с таким названием уже существует' });
        }
        console.error('Ошибка создания производителя:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PUT — обновить производителя (только admin)
router.put('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Название обязательно' });
    }
    try {
        const result = await pool.query(
            'UPDATE manufacturers SET name = $1 WHERE id = $2 RETURNING id, name',
            [name.trim(), id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Производитель не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Производитель с таким названием уже существует' });
        }
        console.error('Ошибка обновления производителя:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// DELETE — удалить производителя (только admin)
router.delete('/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM manufacturers WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Производитель не найден' });
        }
        res.json({ message: 'Производитель удалён' });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(409).json({ error: 'Нельзя удалить — есть связанные записи' });
        }
        console.error('Ошибка удаления производителя:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;
