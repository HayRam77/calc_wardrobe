const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const XLSX = require('xlsx');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM component_types ORDER BY name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const result = await pool.query(
      'INSERT INTO component_types (name, category, description) VALUES ($1, $2, $3) RETURNING *',
      [name, category, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const result = await pool.query(
      'UPDATE component_types SET name=$1, category=$2, description=$3 WHERE id=$4 RETURNING *',
      [name, category, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM component_types WHERE id=$1', [req.params.id]);
    res.json({ message: 'Удалено' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/export', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM component_types ORDER BY name');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Types');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=component_types.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    let imported = 0;
    for (const row of data) {
      if (row.name) {
        await pool.query('INSERT INTO component_types (name, category, description) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
          [row.name, row.category || null, row.description || null]);
        imported++;
      }
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
