const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');

router.use(authMiddleware);

// GET – список всех параметров (доступен всем авторизованным)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parameters ORDER BY param_name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST – создать новый параметр
router.post('/', async (req, res) => {
  const { param_name } = req.body;
  if (!param_name || !param_name.trim()) return res.status(400).json({ error: 'Название параметра обязательно' });
  try {
    const result = await pool.query(
      'INSERT INTO parameters (param_name) VALUES ($1) RETURNING *',
      [param_name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Параметр уже существует' });
    res.status(500).json({ error: err.message });
  }
});

// PUT – редактировать параметр (только админ)
router.put('/:id', isAdmin, async (req, res) => {
  const { param_name } = req.body;
  if (!param_name || !param_name.trim()) return res.status(400).json({ error: 'Название параметра обязательно' });
  try {
    const result = await pool.query(
      'UPDATE parameters SET param_name = $1 WHERE id = $2 RETURNING *',
      [param_name.trim(), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Параметр не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Параметр уже существует' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE – удалить параметр (только админ)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM parameters WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Импорт из Excel (только админ)
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
        await pool.query('INSERT INTO parameters (param_name) VALUES ($1) ON CONFLICT (param_name) DO NOTHING', [name]);
        added++;
      } catch (e) {}
    }
    res.json({ added, total: names.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Экспорт в Excel (только админ)
router.get('/export', isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT param_name FROM parameters ORDER BY param_name');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Параметры');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="parameters.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// PUT – переименовать параметр (админ)
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  const { param_name } = req.body;
  if (!param_name || !param_name.trim()) return res.status(400).json({ error: 'Название обязательно' });
  try {
    const result = await pool.query(
      'UPDATE parameters SET param_name = $1 WHERE id = $2 RETURNING *',
      [param_name.trim(), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Параметр не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Параметр уже существует' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE – удалить параметр (админ)
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  try {
    await pool.query('DELETE FROM parameters WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
