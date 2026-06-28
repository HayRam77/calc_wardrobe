const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM component_types ORDER BY name');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM component_types WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const result = await pool.query(
      'INSERT INTO component_types (name, category, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET category=$2, description=$3 RETURNING *',
      [name, category || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const result = await pool.query(
      'UPDATE component_types SET name=$1, category=$2, description=$3 WHERE id=$4 RETURNING *',
      [name, category || null, description || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM component_types WHERE id = $1', [req.params.id]);
    res.json({ message: 'Удалён' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, category, description FROM component_types ORDER BY id');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Типы компонентов');
    res.setHeader('Content-Disposition', 'attachment; filename=component_types.xlsx');
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
        await pool.query('INSERT INTO component_types (name, category, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET category=$2, description=$3', [row.name, row.category || null, row.description || null]);
        imported++;
      } catch (e) {}
    }
    res.json({ message: `Импортировано ${imported} записей` });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

module.exports = router;
