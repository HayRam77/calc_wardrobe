const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Получить все модули
router.get('/', auth, async (req, res) => {
    try {
        const sort = ['id','name','description'].includes(req.query.sort) ? req.query.sort : 'name';
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
        const result = await pool.query('SELECT * FROM system_modules ORDER BY ' + sort + ' ' + order);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения модулей' });
    }
});

// Получить один модуль
router.get('/export', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, description FROM system_modules ORDER BY COALESCE(position, 9999), name');
        const ws = XLSX.utils.json_to_sheet(result.rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Модули системы');
        res.setHeader('Content-Disposition', 'attachment; filename=system_modules.xlsx');
        res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка экспорта' });
    }
});
router.post('/reorder', auth, isAdmin, async (req, res) => {
  try {
    var items = req.body.items;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: 'items required' });
    for (var i = 0; i < items.length; i++) {
      var id = parseInt(items[i].id), pos = parseInt(items[i].position);
      if (isNaN(id) || isNaN(pos)) continue;
      await pool.query('UPDATE system_modules SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'ok' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM system_modules WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Модуль не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения модуля' });
    }
});

// Создать модуль
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query(
            'INSERT INTO system_modules (name, description) VALUES ($1, $2) RETURNING *',
            [name, description || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка создания модуля' });
    }
});

// Обновить модуль
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query(
            'UPDATE system_modules SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [name, description || null, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Модуль не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка обновления модуля' });
    }
});

// Удалить модуль
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM system_modules WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Модуль не найден' });
        }
        res.json({ message: 'Модуль удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка удаления модуля' });
    }
});

// Экспорт в Excel

// Импорт из Excel
router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
    try {
        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(
                    'INSERT INTO system_modules (name, description) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM system_modules WHERE name = $1)',
                    [row['название'], row['описание'] || null]
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
