const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Получить все типы параметров
router.get('/', auth, async (req, res) => {
    try {
        const sort = ['id','name','value'].includes(req.query.sort) ? req.query.sort : 'name';
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
        const result = await pool.query('SELECT id, name, value FROM system_parameter_types ORDER BY ' + sort + ' ' + order);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения типов параметров' });
    }
});

// Получить один тип
router.get('/export', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id as ID, name as Название, value as Значение FROM system_parameter_types ORDER BY id');
        const ws = XLSX.utils.json_to_sheet(result.rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Типы параметров');
        res.setHeader('Content-Disposition', 'attachment; filename=system_parameter_types.xlsx');
        res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Ошибка экспорта' });
    }
});
router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, value FROM system_parameter_types WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Тип параметра не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения типа параметра' });
    }
});

// Создать
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { name, value } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'Название обязательно' });
        const result = await pool.query(
            'INSERT INTO system_parameter_types (name, value) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET value=$2, updated_at=NOW() RETURNING *',
            [name.trim(), value || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка создания типа параметра' });
    }
});

// Обновить
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name, value } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'Название обязательно' });
        const result = await pool.query(
            'UPDATE system_parameter_types SET name=$1, value=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
            [name.trim(), value || null, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Тип параметра не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка обновления типа параметра' });
    }
});

// Удалить
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM system_parameter_types WHERE id = $1', [req.params.id]);
        res.json({ message: 'Тип параметра удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка удаления типа параметра' });
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
                    'INSERT INTO system_parameter_types (name, value) VALUES ($1,$2) ON CONFLICT (name) DO UPDATE SET value=$2',
                    [row['Название'] || null, row['Значение'] || null]
                );
                imported++;
            } catch (e) {}
        }
        res.json({ message: 'Импортировано ' + imported });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Ошибка импорта' });
    }
});

module.exports = router;
