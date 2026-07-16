// routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { body, validationResult } = require('express-validator');
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

// Обновление пользователя
router.put('/users/:id', auth, isAdmin, validate([
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
router.post('/db/optimize', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let totalRemoved = 0;
        
        // 1. Удаляем осиротевшие записи в ln_values (entity_id не существует)
        const lnResult = await client.query(
            `DELETE FROM ln_values WHERE 
             (entity_type = 'system_component' AND entity_id NOT IN (SELECT id FROM system_components)) OR
             (entity_type = 'block_template' AND entity_id NOT IN (SELECT id FROM block_templates)) OR
             (entity_type = 'material' AND entity_id NOT IN (SELECT id FROM materials))`
        );
        totalRemoved += lnResult.rowCount;
        
        // 2. Удаляем осиротевшие записи в tm_values
        const tmResult = await client.query(
            `DELETE FROM tm_values WHERE 
             (entity_type = 'system_component' AND entity_id NOT IN (SELECT id FROM system_components)) OR
             (entity_type = 'block_template' AND entity_id NOT IN (SELECT id FROM block_templates)) OR
             (entity_type = 'material' AND entity_id NOT IN (SELECT id FROM materials))`
        );
        totalRemoved += tmResult.rowCount;
        
        // 3. Удаляем пустые cabinet_systems (без system_id)
        const emptySystems = await client.query(
            `DELETE FROM cabinet_systems WHERE system_id IS NULL OR system_id NOT IN (SELECT id FROM systems)`
        );
        totalRemoved += emptySystems.rowCount;
        
        // 4. Удаляем неиспользуемые system_block_links
        const sblResult = await client.query(
            `DELETE FROM system_block_links WHERE 
             system_component_id NOT IN (SELECT id FROM system_components) OR
             block_template_id NOT IN (SELECT id FROM block_templates)`
        );
        totalRemoved += sblResult.rowCount;
        
        // 5. Удаляем неиспользуемые system_component_materials
        const scmResult = await client.query(
            `DELETE FROM system_component_materials WHERE 
             system_component_id NOT IN (SELECT id FROM system_components) OR
             material_id NOT IN (SELECT id FROM materials)`
        );
        totalRemoved += scmResult.rowCount;
        
        // 6. Удаляем неиспользуемые project_blocks
        const pbResult = await client.query(
            `DELETE FROM project_blocks WHERE 
             cabinet_id NOT IN (SELECT id FROM cabinets) OR
             template_id NOT IN (SELECT id FROM block_templates)`
        );
        totalRemoved += pbResult.rowCount;
        
        // 7. Удаляем неиспользуемые project_materials
        const pmResult = await client.query(
            `DELETE FROM project_materials WHERE 
             cabinet_id NOT IN (SELECT id FROM cabinets) OR
             material_id NOT IN (SELECT id FROM materials)`
        );
        totalRemoved += pmResult.rowCount;
        
        // 8. Удаляем неиспользуемые system_components_link
        const sclResult = await client.query(
            `DELETE FROM system_components_link WHERE 
             system_id NOT IN (SELECT id FROM systems) OR
             component_id NOT IN (SELECT id FROM system_components)`
        );
        totalRemoved += sclResult.rowCount;
        
        // 9. Очищаем пустые параметры компонентов
        const paramsResult = await client.query(
            `DELETE FROM system_component_params WHERE 
             component_id NOT IN (SELECT id FROM system_components) OR
             parameter_id NOT IN (SELECT id FROM system_parameters)`
        );
        totalRemoved += paramsResult.rowCount;
        
        await client.query('COMMIT');
        res.json({ message: 'Оптимизация завершена. Удалено записей: ' + totalRemoved });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка оптимизации: ' + err.message });
    } finally {
        client.release();
    }
});

module.exports = router;


