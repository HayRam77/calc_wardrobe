const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id as ID, name as Название, type as Тип, description as Описание FROM system_parameters ORDER BY id');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Параметры систем');
    res.setHeader('Content-Disposition', 'attachment; filename=system_parameters.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка экспорта' }); }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try { await pool.query('INSERT INTO system_parameters (name, type, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET type=$2, description=$3', [row['Название'], row['Тип'] || null, row['Описание'] || null]); imported++; } catch (e) {}
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

router.get('/', auth, async (req, res) => { try { const r = await pool.query('SELECT * FROM system_parameters ORDER BY name'); res.json(r.rows); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.get('/:id', auth, async (req, res) => { try { const r = await pool.query('SELECT * FROM system_parameters WHERE id = $1', [req.params.id]); if (r.rows.length === 0) return res.status(404).json({ message: 'Не найден' }); res.json(r.rows[0]); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.post('/', auth, isAdmin, async (req, res) => { try { const r = await pool.query('INSERT INTO system_parameters (name, type, description) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET type=$2, description=$3 RETURNING *', [req.body.name, req.body.type || null, req.body.description || null]); res.status(201).json(r.rows[0]); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.put('/:id', auth, isAdmin, async (req, res) => { try { const r = await pool.query('UPDATE system_parameters SET name=$1, type=$2, description=$3, ln=$4, tm=$5 WHERE id=$6 RETURNING *', [req.body.name, req.body.type || null, req.body.description || null, req.body.ln || null, req.body.tm || null, req.params.id]); res.json(r.rows[0]); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.delete('/:id', auth, isAdmin, async (req, res) => { try { await pool.query('DELETE FROM system_parameters WHERE id = $1', [req.params.id]); res.json({ message: 'Удалён' }); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });

module.exports = router;
