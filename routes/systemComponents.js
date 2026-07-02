const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ==================== ОСНОВНЫЕ CRUD ====================

// Получить все компоненты систем
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sc.*, sct.name as type_name, m.name as manufacturer_name, sm.name as module_name
            FROM system_components sc
            LEFT JOIN system_component_types sct ON sc.type_id = sct.id
            LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
            LEFT JOIN system_modules sm ON sc.module_id = sm.id
            ORDER BY sc.name
        `);
        
        // Загружаем параметры для каждого компонента
        const components = result.rows;
        for (let i = 0; i < components.length; i++) {
            const paramsResult = await pool.query(`
                SELECT scp.*, p.name as parameter_name
                FROM system_component_params scp
                JOIN system_parameters p ON scp.parameter_id = p.id
                WHERE scp.component_id = $1
            `, [components[i].id]);
            components[i].params = paramsResult.rows;
        }
        
        res.json(components);
    } catch (err) {
        console.error('❌ Ошибка получения компонентов:', err);
        res.status(500).json({ message: 'Ошибка получения компонентов', error: err.message });
    }
});

// Получить один компонент
router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sc.*, sct.name as type_name, m.name as manufacturer_name, sm.name as module_name
            FROM system_components sc
            LEFT JOIN system_component_types sct ON sc.type_id = sct.id
            LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
            LEFT JOIN system_modules sm ON sc.module_id = sm.id
            WHERE sc.id = $1
        `, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Компонент не найден' });
        }
        const comp = result.rows[0];
        
        // Загружаем параметры компонента
        const paramsResult = await pool.query(`
            SELECT scp.*, p.name as parameter_name
            FROM system_component_params scp
            JOIN system_parameters p ON scp.parameter_id = p.id
            WHERE scp.component_id = $1
        `, [req.params.id]);
        comp.params = paramsResult.rows;
        
        res.json(comp);
    } catch (err) {
        console.error('❌ Ошибка получения компонента:', err);
        res.status(500).json({ message: 'Ошибка получения компонента' });
    }
});

// Создать компонент
router.post('/', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { name, type_id, module_id, manufacturer_id, article, description, params } = req.body;
        
        const result = await client.query(
            `INSERT INTO system_components (name, type_id, module_id, manufacturer_id, article, description)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [name, type_id || null, module_id || null, manufacturer_id || null, article || null, description || null]
        );
        
        const newComp = result.rows[0];
        
        // Сохраняем параметры
        if (params && params.length) {
            for (const p of params) {
                await client.query(
                    'INSERT INTO system_component_params (component_id, parameter_id, value, type) VALUES ($1, $2, $3, $4)',
                    [newComp.id, p.parameter_id, p.value || null, p.type || null]
                );
            }
        }
        
        await client.query('COMMIT');
        res.status(201).json(newComp);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка создания компонента:', err);
        res.status(500).json({ message: 'Ошибка создания компонента', error: err.message });
    } finally {
        client.release();
    }
});

// Обновить компонент
router.put('/:id', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { name, type_id, module_id, manufacturer_id, article, description, params } = req.body;
        
        const result = await client.query(
            `UPDATE system_components 
             SET name = $1, type_id = $2, module_id = $3, manufacturer_id = $4, 
                 article = $5, description = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [name, type_id || null, module_id || null, manufacturer_id || null, article || null, description || null, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Компонент не найден' });
        }
        
        // Удаляем старые параметры
        await client.query('DELETE FROM system_component_params WHERE component_id = $1', [req.params.id]);
        
        // Сохраняем новые параметры
        if (params && params.length) {
            for (const p of params) {
                await client.query(
                    'INSERT INTO system_component_params (component_id, parameter_id, value, type) VALUES ($1, $2, $3, $4)',
                    [req.params.id, p.parameter_id, p.value || null, p.type || null]
                );
            }
        }
        
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка обновления компонента:', err);
        res.status(500).json({ message: 'Ошибка обновления компонента', error: err.message });
    } finally {
        client.release();
    }
});

// Удалить компонент
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM system_components WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Компонент не найден' });
        }
        res.json({ message: 'Компонент удалён' });
    } catch (err) {
        console.error('❌ Ошибка удаления компонента:', err);
        res.status(500).json({ message: 'Ошибка удаления компонента' });
    }
});

// ==================== СВЯЗИ С КОМПОНЕНТАМИ ШКАФА ====================

// Получить компоненты шкафа, связанные с компонентом системы
router.get('/:id/blocks', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sbl.*, bt.name, bt.article, bt.ln, 
                   ct.name as type_name, m.name as manufacturer_name
            FROM system_block_links sbl
            JOIN block_templates bt ON sbl.block_template_id = bt.id
            LEFT JOIN component_types ct ON bt.type_id = ct.id
            LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
            WHERE sbl.system_component_id = $1
            ORDER BY bt.name
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Ошибка получения связанных компонентов:', err);
        res.status(500).json({ message: 'Ошибка получения связанных компонентов' });
    }
});

// Добавить компонент шкафа к компоненту системы
router.post('/:id/blocks', auth, isAdmin, async (req, res) => {
    try {
        const { block_template_id, quantity } = req.body;
        const result = await pool.query(
            `INSERT INTO system_block_links (system_component_id, block_template_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (system_component_id, block_template_id) 
             DO UPDATE SET quantity = EXCLUDED.quantity
             RETURNING *`,
            [req.params.id, block_template_id, quantity || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка добавления компонента шкафа:', err);
        res.status(500).json({ message: 'Ошибка добавления компонента шкафа' });
    }
});

// Удалить компонент шкафа из компонента системы
router.delete('/:id/blocks/:blockId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM system_block_links WHERE system_component_id = $1 AND id = $2',
            [req.params.id, req.params.blockId]
        );
        res.json({ message: 'Компонент шкафа удалён' });
    } catch (err) {
        console.error('❌ Ошибка удаления компонента шкафа:', err);
        res.status(500).json({ message: 'Ошибка удаления компонента шкафа' });
    }
});

// ==================== ЭКСПОРТ / ИМПОРТ ====================

router.get('/export', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sc.id, sc.name, sct.name as type, sc.article, m.name as manufacturer, sc.description
            FROM system_components sc
            LEFT JOIN system_component_types sct ON sc.type_id = sct.id
            LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
            ORDER BY sc.name
        `);
        const ws = XLSX.utils.json_to_sheet(result.rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Компоненты систем');
        res.setHeader('Content-Disposition', 'attachment; filename=system_components.xlsx');
        res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    } catch (err) {
        console.error('❌ Ошибка экспорта:', err);
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
                    `INSERT INTO system_components (name, article, description)
                     VALUES ($1, $2, $3)`,
                    [row['название'] || row['name'], row['артикул'] || null, row['описание'] || null]
                );
                imported++;
            } catch (e) { console.error(e); }
        }
        res.json({ message: 'Импортировано ' + imported + ' записей' });
    } catch (err) {
        console.error('❌ Ошибка импорта:', err);
        res.status(500).json({ message: 'Ошибка импорта' });
    }
});

module.exports = router;
