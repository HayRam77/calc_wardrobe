const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/manufacturers
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM manufacturers ORDER BY COALESCE(position, 9999), name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения производителей' });
    }
});

// GET /api/manufacturers/export
router.get('/export', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id as ID, name as Название, country as Страна, website as Сайт FROM manufacturers ORDER BY COALESCE(position, 9999), name');
        const ws = XLSX.utils.json_to_sheet(result.rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Производители');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=manufacturers.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка экспорта производителей' });
    }
});

// PUT /api/manufacturers/sort-order & POST /reorder
router.post('/reorder', auth, isAdmin, async (req, res) => {
  try {
    const rawList = req.body.items || req.body.ids;
    if (!rawList || !Array.isArray(rawList)) {
      return res.status(400).json({ message: 'items or ids array required' });
    }
    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      const id = typeof item === 'object' ? parseInt(item.id) : parseInt(item);
      const pos = typeof item === 'object' ? parseInt(item.position) : i;
      if (isNaN(id) || isNaN(pos)) continue;
      await pool.query('UPDATE manufacturers SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'ok' });
  } catch (err) {
    console.error('Ошибка сортировки:', err);
    res.status(500).json({ message: 'Ошибка сортировки' });
  }
});

router.put('/sort-order', auth, isAdmin, async (req, res) => {
  try {
    const rawList = req.body.items || req.body.ids;
    if (!rawList || !Array.isArray(rawList)) {
      return res.status(400).json({ message: 'items or ids array required' });
    }
    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      const id = typeof item === 'object' ? parseInt(item.id) : parseInt(item);
      const pos = typeof item === 'object' ? parseInt(item.position) : i;
      if (isNaN(id) || isNaN(pos)) continue;
      await pool.query('UPDATE manufacturers SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'ok' });
  } catch (err) {
    console.error('Ошибка сортировки:', err);
    res.status(500).json({ message: 'Ошибка сортировки' });
  }
});

// GET /api/manufacturers/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM manufacturers WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения производителя' });
    }
});

// POST /api/manufacturers
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { name, country, website } = req.body;
        const result = await pool.query(
            'INSERT INTO manufacturers (name, country, website) VALUES ($1, $2, $3) RETURNING *',
            [name, country || null, website || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка создания производителя' });
    }
});

// PUT /api/manufacturers/:id
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name, country, website } = req.body;
        const result = await pool.query(
            'UPDATE manufacturers SET name = COALESCE($1, name), country = $2, website = $3 WHERE id = $4 RETURNING *',
            [name, country || null, website || null, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка обновления производителя' });
    }
});

// DELETE /api/manufacturers/:id
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM manufacturers WHERE id = $1', [req.params.id]);
        res.json({ message: 'Удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка удаления производителя' });
    }
});

// POST /api/manufacturers/import
router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
    try {
        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(
                    'INSERT INTO manufacturers (name, country, website) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET country = EXCLUDED.country, website = EXCLUDED.website',
                    [row['Название'] || row['name'], row['Страна'] || row['country'] || null, row['Сайт'] || row['website'] || null]
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
