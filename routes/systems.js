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
    const systems = await pool.query('SELECT * FROM systems ORDER BY name');
    const result = [];
    for (const sys of systems.rows) {
      const comps = await pool.query(`
        SELECT scl.*, sc.name, sc.article, sct.name as type_name
        FROM system_components_link scl
        JOIN system_components sc ON scl.component_id = sc.id
        LEFT JOIN system_component_types sct ON sc.type_id = sct.id
        WHERE scl.system_id = $1 ORDER BY sc.name
      `, [sys.id]);
      result.push({ ...sys, components: comps.rows });
    }
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id as ID, name as Название, description as Описание FROM systems ORDER BY id');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Системы');
    res.setHeader('Content-Disposition', 'attachment; filename=systems.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка экспорта' }); }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try { await pool.query('INSERT INTO systems (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description=$2', [row['Название'], row['Описание'] || null]); imported++; } catch (e) {}
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const sys = await pool.query('SELECT * FROM systems WHERE id = $1', [req.params.id]);
    if (sys.rows.length === 0) return res.status(404).json({ message: 'Не найдена' });
    const comps = await pool.query(`
      SELECT scl.*, sc.name, sc.article, sct.name as type_name
      FROM system_components_link scl
      JOIN system_components sc ON scl.component_id = sc.id
      LEFT JOIN system_component_types sct ON sc.type_id = sct.id
      WHERE scl.system_id = $1
    `, [req.params.id]);
    res.json({ ...sys.rows[0], components: comps.rows });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query('INSERT INTO systems (name, description) VALUES ($1, $2) RETURNING *', [name, description || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, components } = req.body;
    if (name) await client.query('UPDATE systems SET name=$1, description=$2 WHERE id=$3', [name, description || null, req.params.id]);
    if (components && Array.isArray(components)) {
      for (const c of components) {
        await client.query('INSERT INTO system_components_link (system_id, component_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (system_id, component_id) DO UPDATE SET quantity=$3', [req.params.id, c.component_id, c.quantity || 1]);
      }
    }
    await client.query('COMMIT');
    const sys = await pool.query('SELECT * FROM systems WHERE id=$1', [req.params.id]);
    const comps = await pool.query(`
      SELECT scl.*, sc.name, sc.article, sct.name as type_name
      FROM system_components_link scl
      JOIN system_components sc ON scl.component_id = sc.id
      LEFT JOIN system_component_types sct ON sc.type_id = sct.id
      WHERE scl.system_id = $1
    `, [req.params.id]);
    res.json({ ...sys.rows[0], components: comps.rows });
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка' }); }
  finally { client.release(); }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try { await pool.query('DELETE FROM systems WHERE id=$1', [req.params.id]); res.json({ message: 'Удалена' }); }
  catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

module.exports = router;
