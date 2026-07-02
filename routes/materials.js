const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ==================== ОСНОВНЫЕ CRUD ====================

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, man.name as manufacturer_name
            FROM materials m
            LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
            ORDER BY m.name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения материалов' });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, man.name as manufacturer_name
            FROM materials m
            LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
            WHERE m.id = $1
        `, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения материала' });
    }
});

router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { article, name, manufacturer_id, description, unit, price } = req.body;
        const result = await pool.query(
            `INSERT INTO materials (article, name, manufacturer_id, description, unit, price)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [article || null, name, manufacturer_id || null, description || null, unit || null, price || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка создания материала' });
    }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { article, name, manufacturer_id, description, unit, price } = req.body;
        const result = await pool.query(
            `UPDATE materials 
             SET article = $1, name = $2, manufacturer_id = $3, description = $4, 
                 unit = $5, price = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [article || null, name, manufacturer_id || null, description || null, unit || null, price || null, req.params.id]
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

// ==================== МАТЕРИАЛЫ КОМПОНЕНТА СИСТЕМЫ ====================

router.get('/system-component/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT scm.*, m.*, man.name as manufacturer_name
            FROM system_component_materials scm
            JOIN materials m ON scm.material_id = m.id
            LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
            WHERE scm.system_component_id = $1
            ORDER BY m.name
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения материалов компонента системы' });
    }
});

router.post('/system-component/:id', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { material_id, quantity } = req.body;
        
        const result = await client.query(
            `INSERT INTO system_component_materials (system_component_id, material_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (system_component_id, material_id) 
             DO UPDATE SET quantity = EXCLUDED.quantity
             RETURNING *`,
            [req.params.id, material_id, quantity || 1]
        );
        
        const cabinetsResult = await client.query(`
            SELECT DISTINCT cs.cabinet_id, p.id as project_id
            FROM system_components_link scl
            JOIN cabinet_systems cs ON cs.system_id = scl.system_id
            JOIN cabinets c ON cs.cabinet_id = c.id
            JOIN projects p ON c.project_id = p.id
            WHERE scl.component_id = $1
        `, [req.params.id]);
        
        for (const row of cabinetsResult.rows) {
            await client.query(
                `INSERT INTO project_materials (cabinet_id, project_id, material_id, quantity, linked)
                 VALUES ($1, $2, $3, $4, TRUE)
                 ON CONFLICT (cabinet_id, material_id, linked) 
                 DO UPDATE SET quantity = EXCLUDED.quantity`,
                [row.cabinet_id, row.project_id, material_id, quantity || 1]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка добавления материала к компоненту системы' });
    } finally {
        client.release();
    }
});

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

// ==================== МАТЕРИАЛЫ ШКАФА ====================

router.get('/cabinet/:cabinetId/html', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pm.id, pm.material_id, pm.quantity, pm.linked,
                   m.article, m.name as material_name, m.unit, m.price,
                   s.name as system_name,
                   sc.name as component_name
            FROM project_materials pm
            JOIN materials m ON pm.material_id = m.id
            LEFT JOIN system_component_materials scm ON scm.material_id = m.id
            LEFT JOIN system_components sc ON scm.system_component_id = sc.id
            LEFT JOIN system_components_link scl ON scl.component_id = sc.id
            LEFT JOIN systems s ON scl.system_id = s.id
            LEFT JOIN cabinet_systems cs ON cs.system_id = s.id AND cs.cabinet_id = pm.cabinet_id
            WHERE pm.cabinet_id = $1
            ORDER BY pm.id
        `, [req.params.cabinetId]);

        let html = '';
        if (result.rows.length === 0) {
            html = '<p>Нет материалов</p>';
        } else {
            html = '<div class="table-container"><table class="data-table"><thead><tr><th>Система</th><th>Компонент системы</th><th>Артикул</th><th>Название</th><th>Ед. изм.</th><th>Цена</th><th>Кол-во</th><th>Действия</th></tr></thead><tbody>';
            result.rows.forEach(row => {
                const systemName = (row.linked && row.system_name) ? row.system_name : '-';
                const componentName = (row.linked && row.component_name) ? row.component_name : '-';
                html += `<tr>
                    <td>${systemName}</td>
                    <td>${componentName}</td>
                    <td>${row.article || ''}</td>
                    <td>${row.material_name}</td>
                    <td>${row.unit || ''}</td>
                    <td>${row.price || ''}</td>
                    <td>${row.quantity}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" onclick="editMaterialQuantity(${row.id})">✏️</button>
                        <button class="btn btn-sm btn-delete" onclick="delMaterial(${row.id})">🗑️</button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table></div>';
        }
        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка', error: err.message });
    }
});

router.post('/cabinet/:cabinetId', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { material_id, quantity } = req.body;
        
        const projectResult = await client.query(
            'SELECT project_id FROM cabinets WHERE id = $1',
            [req.params.cabinetId]
        );
        
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ message: 'Шкаф не найден' });
        }
        
        const project_id = projectResult.rows[0].project_id;
        
        const result = await client.query(
            `INSERT INTO project_materials (cabinet_id, project_id, material_id, quantity, linked)
             VALUES ($1, $2, $3, $4, FALSE)
             ON CONFLICT (cabinet_id, material_id, linked) 
             DO UPDATE SET quantity = EXCLUDED.quantity
             RETURNING *`,
            [req.params.cabinetId, project_id, material_id, quantity || 1]
        );
        
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка добавления материала в шкаф', error: err.message });
    } finally {
        client.release();
    }
});

router.put('/cabinet/:cabinetId/:materialId', auth, isAdmin, async (req, res) => {
    try {
        const { quantity } = req.body;
        const result = await pool.query(
            'UPDATE project_materials SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE cabinet_id = $2 AND id = $3 RETURNING *',
            [quantity, req.params.cabinetId, req.params.materialId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка обновления количества' });
    }
});

router.delete('/cabinet/:cabinetId/:materialId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM project_materials WHERE cabinet_id = $1 AND id = $2',
            [req.params.cabinetId, req.params.materialId]
        );
        res.json({ message: 'Материал удалён из шкафа' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка удаления материала из шкафа' });
    }
});

// ==================== ЭКСПОРТ / ИМПОРТ ====================

router.get('/export', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.id, m.article, m.name, m.description, m.unit, m.price
            FROM materials m
            ORDER BY m.name
        `);
        const ws = XLSX.utils.json_to_sheet(result.rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Материалы');
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=materials.xlsx');
        res.setHeader('Content-Length', buffer.length);
        
        res.send(buffer);
    } catch (err) {
        console.error('❌ Ошибка экспорта:', err);
        res.status(500).json({ message: 'Ошибка экспорта', error: err.message });
    }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
    try {
        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let imported = 0;
        for (const row of data) {
            try {
                let manufacturerId = null;
                if (row['производитель']) {
                    const manResult = await pool.query(
                        'SELECT id FROM manufacturers WHERE name ILIKE $1 LIMIT 1',
                        [row['производитель']]
                    );
                    if (manResult.rows.length > 0) {
                        manufacturerId = manResult.rows[0].id;
                    }
                }
                await pool.query(
                    `INSERT INTO materials (article, name, manufacturer_id, description, unit, price)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [row['артикул'] || null, row['название'], manufacturerId,
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