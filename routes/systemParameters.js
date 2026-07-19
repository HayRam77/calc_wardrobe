const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/export', auth, async (req, res) => { try { const r = await pool.query('SELECT id as ID, name as Название, type as Тип, description as Описание, ln as LN, tm as TM FROM system_parameters ORDER BY COALESCE(position, 9999), id'); const ws = XLSX.utils.json_to_sheet(r.rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Параметры систем'); res.setHeader('Content-Disposition', 'attachment; filename=system_parameters.xlsx'); res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })); } catch (e) { console.error(e); res.status(500).json({ message: 'Ошибка экспорта' }); } });
router.post('/reorder', auth, isAdmin, async (req, res) => {
  try {
    var items = req.body.items;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: 'items required' });
    for (var i = 0; i < items.length; i++) {
      var id = parseInt(items[i].id), pos = parseInt(items[i].position);
      if (isNaN(id) || isNaN(pos)) continue;
      await pool.query('UPDATE system_parameters SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'ok' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => { try { const wb = XLSX.read(req.file.buffer, { type: 'buffer' }); const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); let imp = 0; for (const row of data) { try { await pool.query('INSERT INTO system_parameters (name, type, description, ln, tm) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (name) DO UPDATE SET type=$2, description=$3, ln=$4, tm=$5', [row['Название'], row['Тип'] || null, row['Описание'] || null, row['LN'] || null, row['TM'] || null]); imp++; } catch (e) {} } res.json({ message: 'Импортировано ' + imp }); } catch (e) { console.error(e); res.status(500).json({ message: 'Ошибка импорта' }); } });
router.get('/', auth, async (req, res) => {
  try {
    const sort = ['id','name','type','description','ln','tm'].includes(req.query.sort) ? req.query.sort : 'name';
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
    const r = await pool.query('SELECT * FROM system_parameters ORDER BY ' + sort + ' ' + order);
    res.json(r.rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Ошибка' }); }
});
router.get('/:id', auth, async (req, res) => { try { const r = await pool.query('SELECT * FROM system_parameters WHERE id = $1', [req.params.id]); if (!r.rows.length) return res.status(404).json({ message: 'Не найден' }); res.json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({ message: 'Ошибка' }); } });
router.post('/', auth, isAdmin, async (req, res) => { try { const r = await pool.query('INSERT INTO system_parameters (name, type, description, ln, tm) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (name) DO UPDATE SET type=$2, description=$3, ln=$4, tm=$5 RETURNING *', [req.body.name, req.body.type || null, req.body.description || null, req.body.ln || null, req.body.tm || null]); res.status(201).json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({ message: 'Ошибка' }); } });
router.put('/:id', auth, isAdmin, async (req, res) => { try { const r = await pool.query('UPDATE system_parameters SET name=$1, type=$2, description=$3, ln=$4, tm=$5 WHERE id=$6 RETURNING *', [req.body.name, req.body.type || null, req.body.description || null, req.body.ln || null, req.body.tm || null, req.params.id]); res.json(r.rows[0]); } catch (e) { console.error(e); res.status(500).json({ message: 'Ошибка' }); } });
router.delete('/:id', auth, isAdmin, async (req, res) => { try { await pool.query('DELETE FROM system_parameters WHERE id = $1', [req.params.id]); res.json({ message: 'Удалён' }); } catch (e) { console.error(e); res.status(500).json({ message: 'Ошибка' }); } });

module.exports = router;
