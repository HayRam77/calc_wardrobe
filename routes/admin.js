// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

// Все маршруты требуют авторизации и роль admin
router.use(auth);
router.use(isAdmin);

// Получить всех пользователей
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения пользователей' });
  }
});

// Создать пользователя (админ может создать другого админа или пользователя)
router.post('/users', validate([
  body('username').trim().notEmpty().withMessage('Имя обязательно'),
  body('email').isEmail().withMessage('Некорректный email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Роль должна быть user или admin')
]), async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashed, role || 'user']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания пользователя' });
  }
});

// Удалить пользователя
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления пользователя' });
  }
});

// Получить все проекты (админ видит все)
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT p.*, u.username as owner FROM projects p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения проектов' });
  }
});

// Получить все шкафы (админ)
router.get('/cabinets', async (req, res) => {
  try {
    const result = await pool.query('SELECT c.*, u.username as owner FROM cabinets c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шкафов' });
  }
});


const { exec } = require('child_process');

// Экспорт дампа БД (только данные)
router.get('/db/export', auth, isAdmin, async (req, res) => {
  try {
    const fileName = 'bd_calc_dump_' + new Date().toISOString().slice(0,10) + '.sql';
    res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
    res.setHeader('Content-Type', 'application/sql');
    const cmd = 'PGPASSWORD=' + (process.env.DB_PASSWORD || '') + ' pg_dump --data-only --inserts --on-conflict-do-nothing -U ' + (process.env.DB_USER || 'hrroot') + ' -h ' + (process.env.DB_HOST || 'localhost') + ' -d ' + (process.env.DB_NAME || 'bd_calc');
    exec(cmd, { maxBuffer: 100 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) { console.error(stderr); return res.status(500).json({ message: 'Ошибка экспорта' }); }
      res.send(stdout);
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка экспорта' }); }
});

// Импорт дампа БД
const multer = require('multer');
const upload = multer({ dest: '/tmp/' });
router.post('/db/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const cmd = 'PGPASSWORD=' + (process.env.DB_PASSWORD || '') + ' psql -U ' + (process.env.DB_USER || 'hrroot') + ' -h ' + (process.env.DB_HOST || 'localhost') + ' -d ' + (process.env.DB_NAME || 'bd_calc') + ' -f ' + filePath;
    exec(cmd, { maxBuffer: 100 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) { console.error(stderr); return res.status(500).json({ message: 'Ошибка импорта: ' + stderr }); }
      res.json({ message: 'Дамп успешно импортирован' });
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

module.exports = router;