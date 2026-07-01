const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Получить все типы
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM component_types ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения типов' });
  }
});

// Получить один тип
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM component_types WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения типа' });
  }
});

// Создать тип
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO component_types (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания типа' });
  }
});

// Обновить тип
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'UPDATE component_types SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления типа' });
  }
});

// Удалить тип
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM component_types WHERE id = $1', [req.params.id]);
    res.json({ message: 'Удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления' });
  }
});

// Экспорт в Excel
router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id as ID, name as Название, description as Описание FROM component_types ORDER BY name');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Типы');
    res.setHeader('Content-Disposition', 'attachment; filename=component_types.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка экспорта' });
  }
});

// Импорт из Excel
router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try {
        await pool.query(
          'INSERT INTO component_types (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [row['Название'], row['Описание'] || null]
        );
        imported++;
      } catch (e) { console.error(e); }
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка импорта' });
  }
});

module.exports = router;
