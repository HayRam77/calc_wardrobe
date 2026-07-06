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
        const { article, name, manufacturer_id, description, unit, price, manufacturer_url, ln, tm } = req.body;
    console.log("📦 PUT materials, manufacturer_url:", manufacturer_url);
    console.log("📦 POST materials, manufacturer_url:", manufacturer_url);
        const result = await pool.query(
            `INSERT INTO materials (article, name, manufacturer_id, description, unit, price, manufacturer_url, ln, tm)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [article || null, name, manufacturer_id || null, description || null, unit || null, price || null, manufacturer_url || null, ln || null, tm || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка создания материала' });
    }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const allowedFields = ['article', 'name', 'manufacturer_id', 'description', 'unit', 'price', 'manufacturer_url', 'ln', 'tm'];
        const updates = [];
        const values = [];
        let idx = 1;
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = $${idx++}`);
                values.push(req.body[field]);
            }
        });
        if (updates.length === 0) {
            return res.status(400).json({ message: 'Нет данных для обновления' });
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(req.params.id);
        const query = `UPDATE materials SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await pool.query(query, values);
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

router.put('/system-component/:componentId/:materialId', auth, isAdmin, async (req, res) => {
    try {
        const { quantity } = req.body;
        const result = await pool.query(
            'UPDATE system_component_materials SET quantity = $1 WHERE system_component_id = $2 AND material_id = $3 RETURNING *',
            [quantity, req.params.componentId, req.params.materialId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Связь не найдена' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка обновления количества материала:', err);
        res.status(500).json({ message: 'Ошибка обновления количества материала' });
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


// ================ МАТЕРИАЛЫ ШКАФА (JSON для таблицы с действиями) ================
router.get('/cabinet/:cabinetId/items', auth, async (req, res) => {
    try {
        const { cabinetId } = req.params;
        const result = await pool.query(`
            SELECT
                pm.id as link_id,
                pm.material_id,
                m.article,
                m.name,
                man.name as manufacturer_name,
                m.unit,
                m.price,
                pm.quantity,
                m.ln,
                m.tm,
                FALSE as is_component_material,
                '-' as system_name,
                '-' as component_name
            FROM project_materials pm
            JOIN materials m ON pm.material_id = m.id
            LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
            WHERE pm.cabinet_id = $1

            UNION ALL

            SELECT
                -scm.id as link_id,
                scm.material_id,
                m.article,
                m.name,
                man.name as manufacturer_name,
                m.unit,
                m.price,
                scm.quantity,
                m.ln,
                m.tm,
                TRUE as is_component_material,
                COALESCE(s.name, '-') as system_name,
                COALESCE(sc.name, '-') as component_name
            FROM system_component_materials scm
            JOIN materials m ON scm.material_id = m.id
            LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
            JOIN system_components sc ON scm.system_component_id = sc.id
            JOIN system_components_link scl ON scl.component_id = sc.id
            JOIN systems s ON scl.system_id = s.id
            JOIN cabinet_systems cs ON cs.system_id = s.id AND cs.cabinet_id = $1

            ORDER BY article, name
        `, [cabinetId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка получения списка материалов шкафа' });
    }
});

// ================ КАЛЬКУЛЯЦИЯ ШКАФА (агрегировано по артикулю) ================
// Для хранения итоговой стоимости шкафа рекомендуется создать таблицу cabinet_totals
// с полями cabinet_id, total_quantity, total_price, updated_at и обновлять её
// при каждом изменении состава материалов шкафа.
router.get('/cabinet/:cabinetId/html', auth, async (req, res) => {
    try {
        const { cabinetId } = req.params;

        // Материалы (агрегированные)
        const matResult = await pool.query(`
            SELECT
                'material' as type,
                MIN(m.id) as id,
                m.article,
                m.name,
                m.ln,
                m.tm,
                SUM(COALESCE(pm.quantity, scm.quantity)) as total_quantity,
                MIN(m.price) as unit_price,
                SUM(COALESCE(pm.quantity, scm.quantity) * COALESCE(m.price, 0)) as total_price
            FROM materials m
            LEFT JOIN project_materials pm ON pm.material_id = m.id AND pm.cabinet_id = $1
            LEFT JOIN system_component_materials scm ON scm.material_id = m.id
            LEFT JOIN system_components sc ON scm.system_component_id = sc.id
            LEFT JOIN system_components_link scl ON scl.component_id = sc.id
            LEFT JOIN systems s ON scl.system_id = s.id
            LEFT JOIN cabinet_systems cs ON cs.system_id = s.id AND cs.cabinet_id = $1
            WHERE (pm.cabinet_id = $1 OR cs.cabinet_id = $1)
              AND m.article IS NOT NULL
            GROUP BY m.article, m.name, m.ln, m.tm
        `, [cabinetId]);

        // Компоненты шкафа (агрегированные)
        const blockResult = await pool.query(`
            SELECT
                'block' as type,
                MIN(bt.id) as id,
                bt.article,
                bt.name,
                bt.ln,
                bt.tm,
                SUM(COALESCE(pb.quantity, sbl.quantity)) as total_quantity,
                MIN(bt.price) as unit_price,
                SUM(COALESCE(pb.quantity, sbl.quantity) * COALESCE(bt.price, 0)) as total_price
            FROM block_templates bt
            LEFT JOIN project_blocks pb ON pb.template_id = bt.id AND pb.cabinet_id = $1
            LEFT JOIN system_block_links sbl ON sbl.block_template_id = bt.id
            LEFT JOIN system_components sc ON sbl.system_component_id = sc.id
            LEFT JOIN system_components_link scl ON scl.component_id = sc.id
            LEFT JOIN systems s ON scl.system_id = s.id
            LEFT JOIN cabinet_systems cs ON cs.system_id = s.id AND cs.cabinet_id = $1
            WHERE (pb.cabinet_id = $1 OR cs.cabinet_id = $1)
              AND bt.article IS NOT NULL
            GROUP BY bt.article, bt.name, bt.ln, bt.tm
        `, [cabinetId]);

        // Объединяем и сортируем
        const rows = [...matResult.rows, ...blockResult.rows]
            .sort((a, b) => (a.article || '').localeCompare(b.article || ''));

        let totalQuantity = 0;
        let totalLn = 0;
        let totalTm = 0;
        let totalPrice = 0;
        let html = '';
        if (rows.length === 0) {
            html = '<p>Нет материалов и компонентов для калькуляции</p>';
        } else {
            html = '<div class="table-container"><table class="data-table"><thead><tr>' +
                '<th>ID</th><th>Артикул</th><th>Название</th><th>LN</th><th>TM</th><th>Кол-во</th><th>Цена ед.</th><th>Цена всего</th></tr></thead><tbody>';

            rows.forEach(row => {
                totalQuantity += Number(row.total_quantity);
                totalPrice += Number(row.total_price);
                totalLn += Number(row.ln) || 0;
                totalTm += Number(row.tm) || 0;
                html += '<tr>' +
                    '<td>' + row.id + '</td>' +
                    '<td>' + (row.article || '') + '</td>' +
                    '<td>' + (row.name || '') + '</td>' +
                    '<td>' + (row.ln || '') + '</td>' +
                    '<td>' + (row.tm || '') + '</td>' +
                    '<td>' + row.total_quantity + '</td>' +
                    '<td>' + (row.unit_price !== null ? parseFloat(row.unit_price).toFixed(2) : '') + '</td>' +
                    '<td>' + parseFloat(row.total_price).toFixed(2) + '</td>' +
                    '</tr>';
            });

            // Итоговая строка
            html += '<tr class="total-row" style="font-weight:bold; background:#f0f0f0;">' +
                '<td colspan="3">Итого</td>' +
                '<td>' + totalLn + '</td>' +
                '<td>' + totalTm + '</td>' +
                '<td></td>' +
                '<td></td>' +
                '<td>' + totalPrice.toFixed(2) + '</td>' +
                '</tr>';
            html += '</tbody></table></div>';
            html += '<span id="cabinetTotalPrice" data-total-price="' + totalPrice.toFixed(2) + '" style="display:none;"></span>';
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
    const materialId = parseInt(req.params.materialId);
    const { quantity } = req.body;

    if (materialId < 0) {
        const realId = -materialId;
        try {
            const result = await pool.query(
                'UPDATE system_component_materials SET quantity = $1 WHERE id = $2 RETURNING *',
                [quantity, realId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Запись не найдена' });
            }
            return res.json(result.rows[0]);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Ошибка обновления количества' });
        }
    }

    try {
        const result = await pool.query(
            'UPDATE project_materials SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE cabinet_id = $2 AND id = $3 RETURNING *',
            [quantity, req.params.cabinetId, materialId]
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
    const materialId = parseInt(req.params.materialId);

    if (materialId < 0) {
        const realId = -materialId;
        try {
            await pool.query('DELETE FROM system_component_materials WHERE id = $1', [realId]);
            res.json({ message: 'Материал удалён из компонента системы' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Ошибка удаления материала из компонента системы' });
        }
        return;
    }

    try {
        await pool.query(
            'DELETE FROM project_materials WHERE cabinet_id = $1 AND id = $2',
            [req.params.cabinetId, materialId]
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
            SELECT m.id, m.article, m.name, m.description, m.unit, m.price, m.manufacturer_url, m.ln, m.tm
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
                    `INSERT INTO materials (article, name, manufacturer_id, description, unit, price, manufacturer_url, ln, tm)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [row['артикул'] || null, row['название'], manufacturerId,
                     row['описание'] || null, row['Ед.изм.'] || null, row['цена'] || null,
                     row['ссылка на производителя'] || null, row['ln'] || null, row['tm'] || null]
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
