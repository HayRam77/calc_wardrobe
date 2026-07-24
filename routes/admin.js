// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validation');
const { exec } = require('child_process');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: '/tmp/' });

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

// Создать пользователя
router.post('/users', validate([
  body('username').trim().notEmpty().withMessage('Имя обязательно'),
  body('email').optional().isEmail().withMessage('Некорректный email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Роль должна быть user или admin')
]), async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email || null, hashed, role || 'user']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Пользователь с таким именем или email уже существует' });
    }
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

// Получить все проекты
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT p.*, u.username as owner FROM projects p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения проектов' });
  }
});

// Получить все шкафы
router.get('/cabinets', async (req, res) => {
  try {
    const result = await pool.query('SELECT c.*, u.username as owner FROM cabinets c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шкафов' });
  }
});

// ========== ЭКСПОРТ ДАМПА БД ==========
router.get('/db/export', async (req, res) => {
  try {
    const fileName = 'bd_calc_dump_' + new Date().toISOString().slice(0,10) + '.sql';
    res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
    res.setHeader('Content-Type', 'application/sql');

    const dbUser = process.env.DB_USER || 'hrroot';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'bd_calc';
    const dbPassword = process.env.DB_PASSWORD || 'CalcWardrobe2026!';

    const cmd = `pg_dump --data-only --inserts --on-conflict-do-nothing -U ${dbUser} -h ${dbHost} -d ${dbName}`;

    exec(cmd, { 
      maxBuffer: 100 * 1024 * 1024,
      env: { ...process.env, PGPASSWORD: dbPassword }
    }, (err, stdout, stderr) => {
      if (err) {
        console.error('Ошибка pg_dump:', stderr);
        return res.status(500).json({ message: 'Ошибка экспорта базы данных' });
      }
      res.send(stdout);
    });
  } catch (err) {
    console.error('Ошибка экспорта:', err);
    res.status(500).json({ message: 'Ошибка экспорта' });
  }
});

// ========== ИМПОРТ ДАМПА БД ==========
router.post('/db/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Файл дампа не загружен' });
  }
  const filePath = req.file.path;
  try {
    const dbUser = process.env.DB_USER || 'hrroot';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'bd_calc';
    const dbPassword = process.env.DB_PASSWORD || 'CalcWardrobe2026!';

    const cmd = `psql -U ${dbUser} -h ${dbHost} -d ${dbName} -f "${filePath}"`;

    exec(cmd, { 
      maxBuffer: 100 * 1024 * 1024,
      env: { ...process.env, PGPASSWORD: dbPassword }
    }, (err, stdout, stderr) => {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }

      if (err) {
        console.error('Ошибка импорта psql:', stderr);
        return res.status(500).json({ message: 'Ошибка импорта дампа: ' + (stderr || err.message) });
      }
      res.json({ message: 'Дамп успешно импортирован!' });
    });
  } catch (err) {
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    console.error('Ошибка импорта:', err);
    res.status(500).json({ message: 'Ошибка импорта: ' + err.message });
  }
});

// ========== ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ==========
router.put('/users/:id', validate([
    body('username').optional().trim().notEmpty().withMessage('Имя пользователя не может быть пустым'),
    body('email').optional().trim(),
    body('password').optional(),
    body('role').optional().isIn(['user', 'admin']).withMessage('Роль должна быть user или admin')
]), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Ошибка валидации', errors: errors.array() });
    }
    try {
        const { id } = req.params;
        const { username, email, password, role } = req.body;
        const updates = [];
        const values = [];
        let idx = 1;

        if (username !== undefined) {
            updates.push(`username = $${idx++}`);
            values.push(username.trim());
        }
        if (email !== undefined) {
            updates.push(`email = $${idx++}`);
            values.push(email.trim() || null);
        }
        if (password !== undefined && password.trim() !== '') {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            updates.push(`password_hash = $${idx++}`);
            values.push(hash);
        }
        if (role !== undefined) {
            updates.push(`role = $${idx++}`);
            values.push(role);
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        if (updates.length <= 1) {
            return res.status(400).json({ message: 'Нет данных для обновления' });
        }

        const result = await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, email, role, created_at, updated_at`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Пользователь с таким именем или email уже существует' });
        }
        res.status(500).json({ message: 'Ошибка обновления пользователя' });
    }
});

// ========== ОПТИМИЗАЦИЯ БД ==========
router.post('/db/optimize', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let totalRemoved = 0;
        
        // 1. Удаляем пустые/осиротевшие cabinet_systems
        const emptySystems = await client.query(
            `DELETE FROM cabinet_systems WHERE system_id IS NULL OR system_id NOT IN (SELECT id FROM systems) OR cabinet_id NOT IN (SELECT id FROM cabinets)`
        );
        totalRemoved += emptySystems.rowCount;
        
        // 2. Удаляем осиротевшие system_block_links
        const sblResult = await client.query(
            `DELETE FROM system_block_links WHERE 
             system_component_id NOT IN (SELECT id FROM system_components) OR
             block_template_id NOT IN (SELECT id FROM block_templates)`
        );
        totalRemoved += sblResult.rowCount;
        
        // 3. Удаляем осиротевшие system_component_materials
        const scmResult = await client.query(
            `DELETE FROM system_component_materials WHERE 
             system_component_id NOT IN (SELECT id FROM system_components) OR
             material_id NOT IN (SELECT id FROM materials)`
        );
        totalRemoved += scmResult.rowCount;
        
        // 4. Удаляем осиротевшие project_blocks
        const pbResult = await client.query(
            `DELETE FROM project_blocks WHERE 
             cabinet_id NOT IN (SELECT id FROM cabinets) OR
             template_id NOT IN (SELECT id FROM block_templates)`
        );
        totalRemoved += pbResult.rowCount;
        
        // 5. Удаляем осиротевшие project_materials
        const pmResult = await client.query(
            `DELETE FROM project_materials WHERE 
             cabinet_id NOT IN (SELECT id FROM cabinets) OR
             material_id NOT IN (SELECT id FROM materials)`
        );
        totalRemoved += pmResult.rowCount;
        
        // 6. Удаляем осиротевшие system_components_link
        const sclResult = await client.query(
            `DELETE FROM system_components_link WHERE 
             system_id NOT IN (SELECT id FROM systems) OR
             component_id NOT IN (SELECT id FROM system_components)`
        );
        totalRemoved += sclResult.rowCount;
        
        // 7. Очищаем осиротевшие параметры компонентов
        const paramsResult = await client.query(
            `DELETE FROM system_component_params WHERE 
             component_id NOT IN (SELECT id FROM system_components) OR
             parameter_id NOT IN (SELECT id FROM system_parameters)`
        );
        totalRemoved += paramsResult.rowCount;

        // 8. Очищаем осиротевшие параметры шаблонов блоков
        const blockParamsResult = await client.query(
            `DELETE FROM component_param_values WHERE 
             component_id NOT IN (SELECT id FROM block_templates) OR
             param_id NOT IN (SELECT id FROM parameters)`
        );
        totalRemoved += blockParamsResult.rowCount;
        
        await client.query('COMMIT');
        res.json({ message: 'Оптимизация базы данных завершена. Удалено устаревших записей: ' + totalRemoved });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Ошибка оптимизации БД:', err);
        res.status(500).json({ message: 'Ошибка оптимизации: ' + err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
