const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// GET /api/materials - Получить список всех материалов
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM materials ORDER BY position ASC, id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching materials:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/materials/sort-order - Сортировка материалов
router.put('/sort-order', auth, isAdmin, async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'Неверный формат данных' });
    }
    try {
        for (const item of items) {
            await pool.query('UPDATE materials SET position = $1 WHERE id = $2', [item.position, item.id]);
        }
        res.json({ message: 'Порядок сохранён' });
    } catch (err) {
        console.error('Error updating materials sort order:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET /api/materials/cabinet/:id/items - Наследуемые материалы шкафа с цепочками связей
router.get('/cabinet/:id/items', auth, async (req, res) => {
    const cabinetId = req.params.id;
    try {
        const query = `
            -- 1. Прямые материалы шкафа
            SELECT 
                cm.id as link_id,
                m.id as material_id,
                m.name,
                m.unit,
                m.price,
                m.ln,
                m.tm,
                cm.quantity,
                FALSE as is_component_material,
                NULL as system_name,
                NULL as component_name,
                NULL as chain_block_template,
                NULL as chain_system_component,
                NULL as chain_type
            FROM cabinet_materials cm
            JOIN materials m ON m.id = cm.material_id
            WHERE cm.cabinet_id = $1

            UNION ALL

            -- 2. Материалы из прямых групп шкафа
            SELECT 
                cmg.id as link_id,
                m.id as material_id,
                m.name,
                m.unit,
                m.price,
                m.ln,
                m.tm,
                (mgi.quantity * cmg.quantity) as quantity,
                TRUE as is_component_material,
                NULL as system_name,
                NULL as component_name,
                'Группа материалов' as chain_block_template,
                mg.name as chain_system_component,
                NULL as chain_type
            FROM cabinet_material_groups cmg
            JOIN material_groups mg ON mg.id = cmg.group_id
            JOIN material_group_items mgi ON mgi.group_id = cmg.group_id
            JOIN materials m ON m.id = mgi.material_id
            WHERE cmg.cabinet_id = $1

            UNION ALL

            -- 3. Материалы компонентов систем шкафа
            SELECT 
                scm.id as link_id,
                m.id as material_id,
                m.name,
                m.unit,
                m.price,
                m.ln,
                m.tm,
                (scm.quantity * sc_link.quantity) as quantity,
                TRUE as is_component_material,
                s.name as system_name,
                sc.name as component_name,
                NULL as chain_block_template,
                sc.name as chain_system_component,
                sct.name as chain_type
            FROM cabinet_systems cs
            JOIN system_block_links sc_link ON sc_link.system_id = cs.system_id
            JOIN system_components sc ON sc.id = sc_link.component_id
            JOIN system_component_materials scm ON scm.component_id = sc.id
            JOIN materials m ON m.id = scm.material_id
            JOIN systems s ON s.id = cs.system_id
            LEFT JOIN system_component_types sct ON sct.id = sc.type_id
            WHERE cs.cabinet_id = $1

            UNION ALL

            -- 4. Материалы из групп компонентов систем шкафа
            SELECT 
                scmg.id as link_id,
                m.id as material_id,
                m.name,
                m.unit,
                m.price,
                m.ln,
                m.tm,
                (mgi.quantity * scmg.quantity * sc_link.quantity) as quantity,
                TRUE as is_component_material,
                s.name as system_name,
                sc.name as component_name,
                NULL as chain_block_template,
                sc.name as chain_system_component,
                sct.name as chain_type
            FROM cabinet_systems cs
            JOIN system_block_links sc_link ON sc_link.system_id = cs.system_id
            JOIN system_components sc ON sc.id = sc_link.component_id
            JOIN system_component_material_groups scmg ON scmg.component_id = sc.id
            JOIN material_group_items mgi ON mgi.group_id = scmg.group_id
            JOIN materials m ON m.id = mgi.material_id
            JOIN systems s ON s.id = cs.system_id
            LEFT JOIN system_component_types sct ON sct.id = sc.type_id
            WHERE cs.cabinet_id = $1

            UNION ALL

            -- 5. Материалы типов компонентов систем
            SELECT 
                sctm.id as link_id,
                m.id as material_id,
                m.name,
                m.unit,
                m.price,
                m.ln,
                m.tm,
                (sctm.quantity * sc_link.quantity) as quantity,
                TRUE as is_component_material,
                s.name as system_name,
                sc.name as component_name,
                NULL as chain_block_template,
                sc.name as chain_system_component,
                sct.name as chain_type
            FROM cabinet_systems cs
            JOIN system_block_links sc_link ON sc_link.system_id = cs.system_id
            JOIN system_components sc ON sc.id = sc_link.component_id
            JOIN system_component_types sct ON sct.id = sc.type_id
            JOIN system_component_type_materials sctm ON sctm.type_id = sct.id
            JOIN materials m ON m.id = sctm.material_id
            JOIN systems s ON s.id = cs.system_id
            WHERE cs.cabinet_id = $1

            UNION ALL

            -- 6. Материалы из групп типов компонентов систем
            SELECT 
                sctmg.id as link_id,
                m.id as material_id,
                m.name,
                m.unit,
                m.price,
                m.ln,
                m.tm,
                (mgi.quantity * sctmg.quantity * sc_link.quantity) as quantity,
                TRUE as is_component_material,
                s.name as system_name,
                sc.name as component_name,
                NULL as chain_block_template,
                sc.name as chain_system_component,
                sct.name as chain_type
            FROM cabinet_systems cs
            JOIN system_block_links sc_link ON sc_link.system_id = cs.system_id
            JOIN system_components sc ON sc.id = sc_link.component_id
            JOIN system_component_types sct ON sct.id = sc.type_id
            JOIN system_component_type_material_groups sctmg ON sctmg.type_id = sct.id
            JOIN material_group_items mgi ON mgi.group_id = sctmg.group_id
            JOIN materials m ON m.id = mgi.material_id
            JOIN systems s ON s.id = cs.system_id
            WHERE cs.cabinet_id = $1

            UNION ALL

            -- 7. Материалы типов блоков шкафа
            SELECT 
                btm.id as link_id,
                m.id as material_id,
                m.name,
                m.unit,
                m.price,
                m.ln,
                m.tm,
                (btm.quantity * cb.quantity) as quantity,
                TRUE as is_component_material,
                NULL as system_name,
                NULL as component_name,
                bt.name as chain_block_template,
                NULL as chain_system_component,
                NULL as chain_type
            FROM cabinet_blocks cb
            JOIN block_template_materials btm ON btm.block_template_id = cb.block_template_id
            JOIN materials m ON m.id = btm.material_id
            JOIN block_templates bt ON bt.id = cb.block_template_id
            WHERE cb.cabinet_id = $1

            UNION ALL

            -- 8. Материалы из групп типов блоков шкафа
            SELECT 
                bmg.id as link_id,
                m.id as material_id,
                m.name,
                m.unit,
                m.price,
                m.ln,
                m.tm,
                (mgi.quantity * bmg.quantity * cb.quantity) as quantity,
                TRUE as is_component_material,
                NULL as system_name,
                NULL as component_name,
                bt.name as chain_block_template,
                NULL as chain_system_component,
                NULL as chain_type
            FROM cabinet_blocks cb
            JOIN block_template_material_groups bmg ON bmg.block_template_id = cb.block_template_id
            JOIN material_group_items mgi ON mgi.group_id = bmg.group_id
            JOIN materials m ON m.id = mgi.material_id
            JOIN block_templates bt ON bt.id = cb.block_template_id
            WHERE cb.cabinet_id = $1;
        `;
        const result = await pool.query(query, [cabinetId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching cabinet items:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET /api/materials/cabinet/:id/html - HTML калькуляции шкафа
router.get('/cabinet/:id/html', auth, async (req, res) => {
    const cabinetId = req.params.id;
    try {
        const query = `
            SELECT 
                m.id,
                m.name,
                m.unit,
                m.price,
                m.ln,
                m.tm,
                SUM(q.quantity) as quantity,
                SUM(q.quantity * COALESCE(NULLIF(regexp_replace(m.ln, '[^0-9.]', '', 'g'), '')::numeric, 0)) as total_ln,
                SUM(q.quantity * COALESCE(NULLIF(regexp_replace(m.tm, '[^0-9.]', '', 'g'), '')::numeric, 0)) as total_tm
            FROM (
                SELECT material_id, quantity FROM cabinet_materials WHERE cabinet_id = $1
                UNION ALL
                SELECT mgi.material_id, (mgi.quantity * cmg.quantity) FROM cabinet_material_groups cmg JOIN material_group_items mgi ON mgi.group_id = cmg.group_id WHERE cmg.cabinet_id = $1
                UNION ALL
                SELECT scm.material_id, (scm.quantity * sc_link.quantity) FROM cabinet_systems cs JOIN system_block_links sc_link ON sc_link.system_id = cs.system_id JOIN system_component_materials scm ON scm.component_id = sc_link.component_id WHERE cs.cabinet_id = $1
                UNION ALL
                SELECT mgi.material_id, (mgi.quantity * scmg.quantity * sc_link.quantity) FROM cabinet_systems cs JOIN system_block_links sc_link ON sc_link.system_id = cs.system_id JOIN system_component_material_groups scmg ON scmg.component_id = sc_link.component_id JOIN material_group_items mgi ON mgi.group_id = scmg.group_id WHERE cs.cabinet_id = $1
                UNION ALL
                SELECT sctm.material_id, (sctm.quantity * sc_link.quantity) FROM cabinet_systems cs JOIN system_block_links sc_link ON sc_link.system_id = cs.system_id JOIN system_components sc ON sc.id = sc_link.component_id JOIN system_component_type_materials sctm ON sctm.type_id = sc.type_id WHERE cs.cabinet_id = $1
                UNION ALL
                SELECT mgi.material_id, (mgi.quantity * sctmg.quantity * sc_link.quantity) FROM cabinet_systems cs JOIN system_block_links sc_link ON sc_link.system_id = cs.system_id JOIN system_components sc ON sc.id = sc_link.component_id JOIN system_component_type_material_groups sctmg ON sctmg.type_id = sc.type_id JOIN material_group_items mgi ON mgi.group_id = sctmg.group_id WHERE cs.cabinet_id = $1
                UNION ALL
                SELECT btm.material_id, (btm.quantity * cb.quantity) FROM cabinet_blocks cb JOIN block_template_materials btm ON btm.block_template_id = cb.block_template_id WHERE cb.cabinet_id = $1
                UNION ALL
                SELECT mgi.material_id, (mgi.quantity * bmg.quantity * cb.quantity) FROM cabinet_blocks cb JOIN block_template_material_groups bmg ON bmg.block_template_id = cb.block_template_id JOIN material_group_items mgi ON mgi.group_id = bmg.group_id WHERE cb.cabinet_id = $1
            ) q
            JOIN materials m ON m.id = q.material_id
            GROUP BY m.id, m.name, m.unit, m.price, m.ln, m.tm
            ORDER BY m.name ASC;
        `;
        const result = await pool.query(query, [cabinetId]);
        
        let html = '<table class="data-table"><thead><tr><th>Название</th><th>Ед.</th><th>Кол-во</th><th>LN Итого</th><th>TM Итого</th></tr></thead><tbody>';
        let totalLnSum = 0;
        let totalTmSum = 0;

        result.rows.forEach(r => {
            const ln = parseFloat(r.total_ln) || 0;
            const tm = parseFloat(r.total_tm) || 0;
            totalLnSum += ln;
            totalTmSum += tm;
            html += `<tr><td>${r.name}</td><td>${r.unit || ''}</td><td>${r.quantity}</td><td>${ln.toFixed(2)}</td><td>${tm.toFixed(2)}</td></tr>`;
        });

        html += `</tbody><tfoot><tr style="font-weight:bold;background:#f1f5f9;"><td colspan="3">ИТОГО:</td><td>${totalLnSum.toFixed(2)}</td><td>${totalTmSum.toFixed(2)}</td></tr></tfoot></table>`;
        res.send(html);
    } catch (err) {
        console.error('Error calculating cabinet materials html:', err);
        res.status(500).send('<p style="color:red;">Ошибка расчёта калькуляции</p>');
    }
});

// POST /api/materials/cabinet/:id
router.post('/cabinet/:id', auth, isAdmin, async (req, res) => {
    const cabinetId = req.params.id;
    const { material_id, quantity } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO cabinet_materials (cabinet_id, material_id, quantity) VALUES ($1, $2, $3) RETURNING *',
            [cabinetId, material_id, quantity || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding material to cabinet:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/materials/cabinet/:id/:linkId
router.put('/cabinet/:id/:linkId', auth, isAdmin, async (req, res) => {
    const { linkId } = req.params;
    const { quantity } = req.body;
    try {
        const result = await pool.query(
            'UPDATE cabinet_materials SET quantity = $1 WHERE id = $2 RETURNING *',
            [quantity, linkId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating cabinet material:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/materials/cabinet/:id/:linkId
router.delete('/cabinet/:id/:linkId', auth, isAdmin, async (req, res) => {
    const { linkId } = req.params;
    try {
        await pool.query('DELETE FROM cabinet_materials WHERE id = $1', [linkId]);
        res.json({ message: 'Материал удалён из шкафа' });
    } catch (err) {
        console.error('Error deleting cabinet material:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;