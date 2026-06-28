const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { body, param } = require('express-validator');
const validate = require('../middleware/validation');

// Получение всех шкафов проекта
router.get('/', auth, async (req, res) => {
  try {
    const { project_id } = req.query;
    let query = `SELECT c.*, p.name as project_name, u.username as owner_name
       FROM cabinets c
       JOIN projects p ON c.project_id = p.id
       LEFT JOIN users u ON c.user_id = u.id`;
    const params = [];
    if (project_id) { query += ' WHERE c.project_id = $1'; params.push(project_id); }
    query += ' ORDER BY c.id';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Проверяем доступ: админ видит все, пользователь — только свои проекты
    if (req.user.role !== 'admin') {
      const project = await pool.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
      if (project.rows.length === 0 || project.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Нет доступа к этому проекту' });
      }
    }

    const result = await pool.query(
      `SELECT c.*, 
              COALESCE(SUM(comp.price * comp.quantity), 0) as total_price
       FROM cabinets c
       LEFT JOIN components comp ON c.id = comp.cabinet_id
       WHERE c.project_id = $1
       GROUP BY c.id
       ORDER BY c.created_at`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шкафов' });
  }
});

// Получение одного шкафа
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, p.user_id as project_owner
       FROM cabinets c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Шкаф не найден' });
    }

    const cabinet = result.rows[0];
    // Проверка доступа
    if (req.user.role !== 'admin' && cabinet.project_owner !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа' });
    }

    res.json(cabinet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шкафа' });
  }
});

// Создание шкафа
router.post('/', auth, validate([
  body('name').trim().notEmpty().withMessage('Название шкафа обязательно'),
  body('project_id').isInt({ min: 1 }).withMessage('Укажите корректный ID проекта'),
  body('description').optional().trim(),
  body('width').optional({ nullable: true }),
  body('height').optional({ nullable: true }),
  body('depth').optional({ nullable: true })
]), async (req, res) => {
  try {
    const { name, description, project_id, width, height, depth } = req.body;

    // Проверяем, что проект принадлежит пользователю (или админ)
    if (req.user.role !== 'admin') {
      const project = await pool.query('SELECT user_id FROM projects WHERE id = $1', [project_id]);
      if (project.rows.length === 0 || project.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Нет прав на добавление шкафа в этот проект' });
      }
    }

    const result = await pool.query(
      `INSERT INTO cabinets (name, description, project_id, width, height, depth, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description || null, project_id, width || null, height || null, depth || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания шкафа' });
  }
});

// Обновление шкафа (только владелец проекта или админ)
router.put('/:id', auth, validate([
  param('id').isInt().withMessage('Некорректный ID'),
  body('name').optional().trim().notEmpty().withMessage('Название не может быть пустым'),
  body('description').optional().trim(),
  body('width').optional().isFloat({ min: 0 }),
  body('height').optional().isFloat({ min: 0 }),
  body('depth').optional().isFloat({ min: 0 })
]), async (req, res) => {
  try {
    const { id } = req.params;

    // Проверка принадлежности шкафа к проекту текущего пользователя
    const cabinet = await pool.query(
      `SELECT c.id, p.user_id as project_owner
       FROM cabinets c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [id]
    );
    if (cabinet.rows.length === 0) {
      return res.status(404).json({ message: 'Шкаф не найден' });
    }
    if (req.user.role !== 'admin' && cabinet.rows[0].project_owner !== req.user.id) {
      return res.status(403).json({ message: 'Нет прав на изменение шкафа' });
    }

    const fields = [];
    const values = [];
    let counter = 1;

    for (const field of ['name', 'description', 'width', 'height', 'depth']) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = $${counter++}`);
        values.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    values.push(id);
    const query = `UPDATE cabinets SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *`;
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления шкафа' });
  }
});

// Удаление шкафа (только владелец проекта или админ)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Проверка прав
    const cabinet = await pool.query(
      `SELECT c.id, p.user_id as project_owner
       FROM cabinets c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [id]
    );
    if (cabinet.rows.length === 0) {
      return res.status(404).json({ message: 'Шкаф не найден' });
    }
    if (req.user.role !== 'admin' && cabinet.rows[0].project_owner !== req.user.id) {
      return res.status(403).json({ message: 'Нет прав на удаление шкафа' });
    }

    await pool.query('DELETE FROM cabinets WHERE id = $1', [id]);
    res.json({ message: 'Шкаф удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления шкафа' });
  }
});

// Получить компоненты шкафа
router.get('/:id/blocks', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pb.*, bt.name, bt.article, ct.name as type_name, m.name as manufacturer_name
      FROM project_blocks pb
      JOIN block_templates bt ON pb.template_id = bt.id
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      WHERE pb.cabinet_id = $1
      ORDER BY bt.name
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Получить системы шкафа
router.get('/:id/systems', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cs.*, s.name as system_name, s.description as system_description
      FROM cabinet_systems cs
      JOIN systems s ON cs.system_id = s.id
      WHERE cs.cabinet_id = $1
      ORDER BY s.name
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Добавить систему в шкаф
router.post('/:id/systems', auth, isAdmin, async (req, res) => {
  try {
    const { system_id, name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO cabinet_systems (cabinet_id, system_id, name, description) VALUES ($1, $2, $3, $4) ON CONFLICT (cabinet_id, system_id) DO UPDATE SET name=$3, description=$4 RETURNING *',
      [req.params.id, system_id, name || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Удалить систему из шкафа
// Обновить систему в шкафу
router.put('/:id/systems/:systemId', auth, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE cabinet_systems SET name=$1 WHERE id=$2', [name, req.params.systemId]);
    res.json({ message: 'Обновлено' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.delete('/:id/systems/:systemId', auth, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM cabinet_systems WHERE id = $1', [req.params.systemId]);
    res.json({ message: 'Система удалена' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT c.id as ID, c.name as Название, p.name as Проект, u.username as Создатель, c.created_at as Дата_создания, c.description as Описание FROM cabinets c JOIN projects p ON c.project_id = p.id LEFT JOIN users u ON c.user_id = u.id ORDER BY c.id`);
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Шкафы');
    res.setHeader('Content-Disposition', 'attachment; filename=cabinets.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка экспорта' }); }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try {
        const proj = await pool.query('SELECT id FROM projects WHERE name=$1', [row['Проект']]);
        await pool.query('INSERT INTO cabinets (name, project_id, description, user_id) VALUES ($1, $2, $3, $4)', [row['Название'], proj.rows[0]?.id || null, row['Описание'] || null, 1]);
        imported++;
      } catch (e) {}
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

module.exports = router;