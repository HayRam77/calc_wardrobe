// routes/systemComponents.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { body, param } = require('express-validator');
const validate = require('../middleware/validation');

// Получить все компоненты систем с параметрами
router.get('/', auth, async (req, res) => {
  try {
    const components = await pool.query(
      `SELECT sc.id, sc.name, sc.article, sc.description,
              sct.name AS type_name, sct.id AS type_id,
              m.name AS manufacturer_name, m.id AS manufacturer_id
       FROM system_components sc
       LEFT JOIN system_component_types sct ON sc.type_id = sct.id
       LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
       ORDER BY sc.id`
    );

    // Для каждого компонента подгружаем параметры
    const result = await Promise.all(components.rows.map(async (comp) => {
      const params = await pool.query(
        `SELECT sp.id, sp.name, scp.value
         FROM system_component_params scp
         JOIN system_parameters sp ON scp.parameter_id = sp.id
         WHERE scp.component_id = $1`,
        [comp.id]
      );
      return { ...comp, params: params.rows };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения компонентов систем' });
  }
});

// Получить один компонент
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const comp = await pool.query(
      `SELECT sc.id, sc.name, sc.article, sc.description,
              sct.name AS type_name, sct.id AS type_id,
              m.name AS manufacturer_name, m.id AS manufacturer_id
       FROM system_components sc
       LEFT JOIN system_component_types sct ON sc.type_id = sct.id
       LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
       WHERE sc.id = $1`,
      [id]
    );
    if (comp.rows.length === 0) return res.status(404).json({ message: 'Компонент не найден' });

    const params = await pool.query(
      `SELECT sp.id, sp.name, scp.value
       FROM system_component_params scp
       JOIN system_parameters sp ON scp.parameter_id = sp.id
       WHERE scp.component_id = $1`,
      [id]
    );
    res.json({ ...comp.rows[0], params: params.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения компонента' });
  }
});

// Создать компонент (с параметрами)
router.post('/', auth, isAdmin, validate([
  body('name').trim().notEmpty().withMessage('Название обязательно'),
  body('type_id').isInt({ min: 1 }).withMessage('Укажите тип'),
  body('manufacturer_id').optional({ nullable: true }).isInt(),
  body('article').optional().trim(),
  body('description').optional().trim(),
  body('params').optional().isArray()
]), async (req, res) => {
  const { name, type_id, manufacturer_id, article, description, params } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const compResult = await client.query(
      `INSERT INTO system_components (name, type_id, manufacturer_id, article, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, type_id, manufacturer_id || null, article || null, description || null]
    );
    const componentId = compResult.rows[0].id;

    // Добавляем параметры, если переданы
    if (params && params.length > 0) {
      for (const param of params) {
        await client.query(
          `INSERT INTO system_component_params (component_id, parameter_id, value)
           VALUES ($1, $2, $3)`,
          [componentId, param.parameter_id, param.value]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(compResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания компонента' });
  } finally {
    client.release();
  }
});

// Обновить компонент
router.put('/:id', auth, isAdmin, validate([
  param('id').isInt(),
  body('name').optional().trim().notEmpty(),
  body('type_id').optional().isInt(),
  body('manufacturer_id').optional({ nullable: true }).isInt(),
  body('article').optional().trim(),
  body('description').optional().trim(),
  body('params').optional().isArray()
]), async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Обновление полей компонента
    const fields = [];
    const values = [];
    let counter = 1;
    for (const field of ['name', 'type_id', 'manufacturer_id', 'article', 'description']) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = $${counter++}`);
        values.push(req.body[field]);
      }
    }
    if (fields.length > 0) {
      values.push(id);
      await client.query(`UPDATE system_components SET ${fields.join(', ')} WHERE id = $${counter}`, values);
    }

    // Обновление параметров: удаляем старые, вставляем новые
    if (req.body.params) {
      await client.query('DELETE FROM system_component_params WHERE component_id = $1', [id]);
      for (const param of req.body.params) {
        await client.query(
          `INSERT INTO system_component_params (component_id, parameter_id, value)
           VALUES ($1, $2, $3)`,
          [id, param.parameter_id, param.value]
        );
      }
    }

    await client.query('COMMIT');

    // Возвращаем обновлённый компонент с параметрами
    const comp = await pool.query(
      `SELECT sc.id, sc.name, sc.article, sc.description,
              sct.name AS type_name, sct.id AS type_id,
              m.name AS manufacturer_name, m.id AS manufacturer_id
       FROM system_components sc
       LEFT JOIN system_component_types sct ON sc.type_id = sct.id
       LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
       WHERE sc.id = $1`, [id]
    );
    const params = await pool.query(
      `SELECT sp.id, sp.name, scp.value
       FROM system_component_params scp
       JOIN system_parameters sp ON scp.parameter_id = sp.id
       WHERE scp.component_id = $1`, [id]
    );
    res.json({ ...comp.rows[0], params: params.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления компонента' });
  } finally {
    client.release();
  }
});

// Удалить компонент
router.delete('/:id', auth, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM system_components WHERE id = $1', [id]);
    res.json({ message: 'Компонент удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления компонента' });
  }
});

module.exports = router;
// ==================== ЭКСПОРТ / ИМПОРТ ====================
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sc.id, sc.name, sc.article, sc.description,
             sct.name AS type_name, m.name AS manufacturer_name
      FROM system_components sc
      LEFT JOIN system_component_types sct ON sc.type_id = sct.id
      LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
      ORDER BY sc.id
    `);
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Компоненты систем');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=system_components.xlsx');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка экспорта' });
  }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);
    let imported = 0;
    for (const row of data) {
      try {
        const typeRes = await pool.query('SELECT id FROM system_component_types WHERE name = $1', [row.type_name]);
        const manRes = await pool.query('SELECT id FROM manufacturers WHERE name = $1', [row.manufacturer_name]);
        await pool.query(
          'INSERT INTO system_components (name, type_id, manufacturer_id, article, description) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (article) DO UPDATE SET name=$1, type_id=$2, manufacturer_id=$3, description=$5',
          [row.name, typeRes.rows[0]?.id || null, manRes.rows[0]?.id || null, row.article || null, row.description || null]
        );
        imported++;
      } catch (e) { console.error('Ошибка импорта строки:', e); }
    }
    res.json({ message: `Импортировано ${imported} записей` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка импорта' });
  }
});
