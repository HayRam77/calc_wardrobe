const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');

router.use(authMiddleware);

// GET доступен всем
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM manufacturers ORDER BY name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST – только админ
router.post('/', isAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Название производителя обязательно' });
  try {
    const result = await pool.query('INSERT INTO manufacturers (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Производитель с таким названием уже существует' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', isAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Название производителя обязательно' });
  try {
    const result = await pool.query(
      'UPDATE manufacturers SET name = $1 WHERE id = $2 RETURNING *',
      [name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Производитель не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Производитель с таким названием уже существует' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM manufacturers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/import', isAdmin, async (req, res) => {
  try {
    if (!req.files || !req.files.file) return res.status(400).json({ error: 'Файл не загружен' });
    const file = req.files.file;
    const workbook = XLSX.read(file.data, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const names = data.slice(1).flat().filter(v => v && typeof v === 'string').map(v => v.trim());
    let added = 0;
    for (const name of names) {
      try {
        await pool.query('INSERT INTO manufacturers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
        added++;
      } catch (e) {}
    }
    res.json({ added, total: names.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export', async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM manufacturers ORDER BY name');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Производители');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="manufacturers.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
