const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { isAdmin } = require('../middleware/isAdmin');

// Применяем isAdmin ко всем роутам
router.use(isAdmin);

// Получить всех пользователей
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

// Создать пользователя (админом)
router.post('/users', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Валидация
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Недопустимая роль' });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, password_hash, role || 'user']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Пользователь уже существует' });
        }
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Ошибка создания пользователя' });
    }
});

// Сбросить пароль пользователя
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username',
            [password_hash, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Удаляем все сессии пользователя
        await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [req.params.id]);

        res.json({ message: 'Пароль сброшен', user: result.rows[0] });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Ошибка сброса пароля' });
    }
});

// Удалить пользователя
router.delete('/users/:id', async (req, res) => {
    try {
        // Нельзя удалить самого себя
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ error: 'Нельзя удалить самого себя' });
        }

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ message: 'Пользователь удалён', user: result.rows[0] });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Ошибка удаления пользователя' });
    }
});

// Статистика системы
router.get('/stats', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM projects) as total_projects,
                (SELECT COUNT(*) FROM cabinets) as total_cabinets,
                (SELECT COUNT(*) FROM block_templates) as total_templates,
                (SELECT COUNT(*) FROM project_blocks) as total_blocks
        `);
        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});

module.exports = router;