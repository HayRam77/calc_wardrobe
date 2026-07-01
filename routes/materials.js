const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ==================== ОСНОВНЫЕ CRUD ====================

// Получить все материалы
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM materials ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения материалов' });
    }
});

// Получить один материал
router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM materials WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения материала' });
    }
});

// Создать материал
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { article, name, manufacturer, description, unit, price } = req.body;
        const result = await pool.query(
            `INSERT INTO materials (article, name, manufacturer, description, unit, price)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [article || null, name, manufacturer || null, description || null, unit || null, price || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка создания материала' });
    }
});

// Обновить материал
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { article, name, manufacturer, description, unit, price } = req.body;
        const result = await pool.query(
            `UPDATE materials 
             SET article = $1, name = $2, manufacturer = $3, description = $4, 
                 unit = $5, price = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [article || null, name, manufacturer || null, description || null, unit || null, price || null, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка обновления материала' });
    }
});

// Удалить материал
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM materials WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        res.json({ message: 'Материал удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка удаления материала' });
    }
});

// ==================== СВЯЗИ С КОМПОНЕНТАМИ ====================

// Получить материалы компонента системы
router.get('/system-component/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT scm.*, m.* 
            FROM system_component_materials scm
            JOIN materials m ON scm.material_id = m.id
            WHERE scm.system_component_id = $1
            ORDER BY m.name
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения материалов компонента системы' });
    }
});

// Добавить материал к компоненту системы
router.post('/system-component/:id', auth, isAdmin, async (req, res) => {
    try {
        const { material_id, quantity } = req.body;
        const result = await pool.query(
            `INSERT INTO system_component_materials (system_component_id, material_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (system_component_id, material_id) 
             DO UPDATE SET quantity = EXCLUDED.quantity
             RETURNING *`,
            [req.params.id, material_id, quantity || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка добавления материала к компоненту системы' });
    }
});

// Удалить материал из компонента системы
router.delete('/system-component/:componentId/:materialId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM system_component_materials WHERE system_component_id = $1 AND material_id = $2',
            [req.params.componentId, req.params.materialId]
        );
        res.json({ message: 'Материал удалён из компонента системы' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка удаления материала из компонента системы' });
    }
});

// Получить материалы компонента шкафа (шаблона)
router.get('/block-template/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT btm.*, m.* 
            FROM block_template_materials btm
            JOIN materials m ON btm.material_id = m.id
            WHERE btm.block_template_id = $1
            ORDER BY m.name
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения материалов компонента шкафа' });
    }
});

// Добавить материал к компоненту шкафа
router.post('/block-template/:id', auth, isAdmin, async (req, res) => {
    try {
        const { material_id, quantity } = req.body;
        const result = await pool.query(
            `INSERT INTO block_template_materials (block_template_id, material_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (block_template_id, material_id) 
             DO UPDATE SET quantity = EXCLUDED.quantity
             RETURNING *`,
            [req.params.id, material_id, quantity || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка добавления материала к компоненту шкафа' });
    }
});

// Удалить материал из компонента шкафа
router.delete('/block-template/:templateId/:materialId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM block_template_materials WHERE block_template_id = $1 AND material_id = $2',
            [req.params.templateId, req.params.materialId]
        );
        res.json({ message: 'Материал удалён из компонента шкафа' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка удаления материала из компонента шкафа' });
    }
});

// ==================== ЭКСПОРТ / ИМПОРТ ====================

router.get('/export', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, article, name, manufacturer, description, unit, price FROM materials ORDER BY name');
        const ws = XLSX.utils.json_to_sheet(result.rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Материалы');
        res.setHeader('Content-Disposition', 'attachment; filename=materials.xlsx');
        res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка экспорта' });
    }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
    try {
        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(
                    `INSERT INTO materials (article, name, manufacturer, description, unit, price)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT DO NOTHING`,
                    [row['артикул'] || null, row['название'], row['производитель'] || null, 
                     row['описание'] || null, row['Ед.изм.'] || null, row['цена'] || null]
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
