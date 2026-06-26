const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAdmin } = require('../middleware/isAdmin');
const multer = require('multer');
const XLSX = require('xlsx');

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Получить все шаблоны
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM block_templates ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Ошибка получения шаблонов' });
    }
});

// Создать шаблон
router.post('/', async (req, res) => {
    try {
        const { name, type, parameters } = req.body;
        
        const result = await pool.query(
            'INSERT INTO block_templates (name, type, parameters) VALUES ($1, $2, $3) RETURNING *',
            [name, type, JSON.stringify(parameters || {})]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Ошибка создания шаблона' });
    }
});

// Обновить шаблон
router.put('/:id', async (req, res) => {
    try {
        const { name, type, parameters } = req.body;
        
        const result = await pool.query(
            'UPDATE block_templates SET name = $1, type = $2, parameters = $3 WHERE id = $4 RETURNING *',
            [name, type, JSON.stringify(parameters || {}), req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Шаблон не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Ошибка обновления шаблона' });
    }
});

// Удалить шаблон (только админ)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM block_templates WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Шаблон не найден' });
        }
        
        res.json({ message: 'Шаблон удалён' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Ошибка удаления шаблона' });
    }
});

// Экспорт в Excel
router.get('/export', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM block_templates');
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(result.rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Templates');
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=templates.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting templates:', error);
        res.status(500).json({ error: 'Ошибка экспорта' });
    }
});

// Импорт из Excel
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            for (const row of data) {
                await client.query(
                    'INSERT INTO block_templates (name, type, parameters) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                    [row.name, row.type, JSON.stringify(row.parameters || {})]
                );
            }
            
            await client.query('COMMIT');
            res.json({ message: `Импортировано ${data.length} записей` });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error importing templates:', error);
        res.status(500).json({ error: 'Ошибка импорта' });
    }
});

module.exports = router;