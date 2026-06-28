// routes/systemParameters.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

// Получить все параметры
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM system_parameters ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения параметров' });
  }
});

// Получить один параметр
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM system_parameters WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Параметр не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения параметра' });
  }
});

// Создать параметр (только админ)
router.post('/', auth, isAdmin, validate([
  body('name').trim().notEmpty().withMessage('Название параметра обязательно'),
  body('value').optional().trim(),
  body('description').optional().trim()
]), async (req, res) => {
  const { name, value, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO system_parameters (name, value, description) VALUES ($1, $2, $3) RETURNING *',
      [name, value || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания параметра' });
  }
});

// Обновить параметр (только админ)
router.put('/:id', auth, isAdmin, validate([
  body('name').optional().trim().notEmpty(),
  body('value').optional().trim(),
  body('description').optional().trim()
]), async (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];
  let counter = 1;
  for (const field of ['name', 'value', 'description']) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = $${counter++}`);
      values.push(req.body[field]);
    }
  }
  if (fields.length === 0) return res.status(400).json({ message: 'Нет данных для обновления' });

  values.push(id);
  try {
    const result = await pool.query(
      `UPDATE system_parameters SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Параметр не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления параметра' });
  }
});

// Удалить параметр (только админ)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM system_parameters WHERE id = $1', [id]);
    res.json({ message: 'Параметр удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления параметра' });
  }
});

module.exports = router;
// ==================== ЭКСПОРТ / ИМПОРТ ====================
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, value, description FROM system_parameters ORDER BY id');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Параметры компонентов систем');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=system_parameters.xlsx');
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
        await pool.query(
          'INSERT INTO system_parameters (name, value, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET value=$2, description=$3',
          [row.name, row.value || null, row.description || null]
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
