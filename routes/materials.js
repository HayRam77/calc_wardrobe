const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/materials - Получить список всех материалов
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, man.name as manufacturer_name 
            FROM materials m
            LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
            ORDER BY m.position ASC, m.id ASC
        `);
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

// GET /api/materials/export — Экспорт материалов в Excel
router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.id as ID, m.article as Артикул, m.name as Название, man.name as Производитель,
             m.description as Описание, m.unit as Ед_изм, m.price as Цена,
             m.ln as LN, m.tm as TM, m.manufacturer_url as Ссылка
      FROM materials m
      LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
      ORDER BY m.position ASC, m.id ASC
    `);
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Материалы');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=materials.xlsx');
    res.send(buffer);
  } catch (err) {
    console.error('Ошибка экспорта материалов:', err);
    res.status(500).json({ message: 'Ошибка экспорта' });
  }
});

// POST /api/materials/import — Импорт материалов из Excel
router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try {
        let manId = null;
        if (row['Производитель']) {
          const manRes = await pool.query('SELECT id FROM manufacturers WHERE name = $1', [row['Производитель']]);
          if (manRes.rows.length > 0) manId = manRes.rows[0].id;
        }
        await pool.query(
          `INSERT INTO materials (article, name, manufacturer_id, description, unit, price, ln, tm, manufacturer_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [row['Артикул'] || null, row['Название'] || row['name'], manId, row['Описание'] || null, row['Ед_изм'] || row['unit'] || null, parseFloat(row['Цена']) || null, row['LN'] || null, row['TM'] || null, row['Ссылка'] || null]
        );
        imported++;
      } catch (e) { console.error(e); }
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) {
    console.error('Ошибка импорта материалов:', err);
    res.status(500).json({ message: 'Ошибка импорта' });
  }
});

// GET /api/materials/cabinet/:id/items - Наследуемые материалы шкафа с цепочками связей
router.get('/cabinet/:id/items', auth, async (req, res) => {
    const cabinetId = req.params.id;
    try {
        const query = `
            -- 1. Прямые материалы шкафа
            SELECT 
                pm.id as link_id,
                m.id as material_id,
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                COALESCE(pm.quantity, 1)::numeric as quantity,
                FALSE as is_component_material,
                NULL::text as system_name,
                NULL::text as component_name,
                NULL::text as chain_block_template,
                NULL::text as chain_system_component,
                NULL::text as chain_type,
                NULL::text as group_name
            FROM project_materials pm
            JOIN materials m ON m.id = pm.material_id
            WHERE pm.cabinet_id = $1

            UNION ALL

            -- 2. Материалы из прямых групп шкафа
            SELECT 
                cmg.group_id as link_id,
                m.id as material_id,
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                COALESCE(mgi.quantity, 1)::numeric as quantity,
                TRUE as is_component_material,
                NULL::text as system_name,
                NULL::text as component_name,
                NULL::text as chain_block_template,
                mg.name::text as chain_system_component,
                NULL::text as chain_type,
                mg.name::text as group_name
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
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                COALESCE(scm.quantity, 1)::numeric as quantity,
                TRUE as is_component_material,
                s.name::text as system_name,
                sc.name::text as component_name,
                NULL::text as chain_block_template,
                sc.name::text as chain_system_component,
                sct.name::text as chain_type,
                NULL::text as group_name
            FROM cabinet_systems cs
            JOIN systems s ON s.id = cs.system_id
            JOIN system_components_link scl ON scl.system_id = s.id
            JOIN system_components sc ON sc.id = scl.component_id
            JOIN system_component_materials scm ON scm.system_component_id = sc.id
            JOIN materials m ON m.id = scm.material_id
            LEFT JOIN system_component_types sct ON sct.id = sc.type_id
            WHERE cs.cabinet_id = $1

            UNION ALL

            -- 4. Материалы из групп компонентов систем шкафа
            SELECT 
                scmg.group_id as link_id,
                m.id as material_id,
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                COALESCE(mgi.quantity, 1)::numeric as quantity,
                TRUE as is_component_material,
                s.name::text as system_name,
                sc.name::text as component_name,
                NULL::text as chain_block_template,
                sc.name::text as chain_system_component,
                sct.name::text as chain_type,
                mg.name::text as group_name
            FROM cabinet_systems cs
            JOIN systems s ON s.id = cs.system_id
            JOIN system_components_link scl ON scl.system_id = s.id
            JOIN system_components sc ON sc.id = scl.component_id
            JOIN system_component_material_groups scmg ON scmg.component_id = sc.id
            JOIN material_groups mg ON mg.id = scmg.group_id
            JOIN material_group_items mgi ON mgi.group_id = scmg.group_id
            JOIN materials m ON m.id = mgi.material_id
            LEFT JOIN system_component_types sct ON sct.id = sc.type_id
            WHERE cs.cabinet_id = $1

            UNION ALL

            -- 5. Материалы типов компонентов систем
            SELECT 
                sctm.id as link_id,
                m.id as material_id,
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                COALESCE(sctm.quantity, 1)::numeric as quantity,
                TRUE as is_component_material,
                s.name::text as system_name,
                sc.name::text as component_name,
                NULL::text as chain_block_template,
                sc.name::text as chain_system_component,
                sct.name::text as chain_type,
                NULL::text as group_name
            FROM cabinet_systems cs
            JOIN systems s ON s.id = cs.system_id
            JOIN system_components_link scl ON scl.system_id = s.id
            JOIN system_components sc ON sc.id = scl.component_id
            JOIN system_component_types sct ON sct.id = sc.type_id
            JOIN system_component_type_materials sctm ON sctm.type_id = sct.id
            JOIN materials m ON m.id = sctm.material_id
            WHERE cs.cabinet_id = $1

            UNION ALL

            -- 6. Материалы из групп типов компонентов систем
            SELECT 
                sctmg.group_id as link_id,
                m.id as material_id,
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                COALESCE(mgi.quantity, 1)::numeric as quantity,
                TRUE as is_component_material,
                s.name::text as system_name,
                sc.name::text as component_name,
                NULL::text as chain_block_template,
                sc.name::text as chain_system_component,
                sct.name::text as chain_type,
                mg.name::text as group_name
            FROM cabinet_systems cs
            JOIN systems s ON s.id = cs.system_id
            JOIN system_components_link scl ON scl.system_id = s.id
            JOIN system_components sc ON sc.id = scl.component_id
            JOIN system_component_types sct ON sct.id = sc.type_id
            JOIN system_component_type_material_groups sctmg ON sctmg.type_id = sct.id
            JOIN material_groups mg ON mg.id = sctmg.group_id
            JOIN material_group_items mgi ON mgi.group_id = sctmg.group_id
            JOIN materials m ON m.id = mgi.material_id
            WHERE cs.cabinet_id = $1

            UNION ALL

            -- 7. Материалы компонентов шкафа (блоков)
            SELECT 
                btm.id as link_id,
                m.id as material_id,
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                (COALESCE(btm.quantity, 1) * COALESCE(pb.quantity, 1))::numeric as quantity,
                TRUE as is_component_material,
                NULL::text as system_name,
                NULL::text as component_name,
                bt.name::text as chain_block_template,
                NULL::text as chain_system_component,
                NULL::text as chain_type,
                NULL::text as group_name
            FROM project_blocks pb
            JOIN block_templates bt ON bt.id = pb.template_id
            JOIN block_template_materials btm ON btm.block_template_id = bt.id
            JOIN materials m ON m.id = btm.material_id
            WHERE pb.cabinet_id = $1

            UNION ALL

            -- 8. Материалы из групп компонентов шкафа (блоков)
            SELECT 
                bmg.group_id as link_id,
                m.id as material_id,
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                (COALESCE(mgi.quantity, 1) * COALESCE(pb.quantity, 1))::numeric as quantity,
                TRUE as is_component_material,
                NULL::text as system_name,
                NULL::text as component_name,
                bt.name::text as chain_block_template,
                NULL::text as chain_system_component,
                NULL::text as chain_type,
                mg.name::text as group_name
            FROM project_blocks pb
            JOIN block_templates bt ON bt.id = pb.template_id
            JOIN block_template_material_groups bmg ON bmg.block_template_id = bt.id
            JOIN material_groups mg ON mg.id = bmg.group_id
            JOIN material_group_items mgi ON mgi.group_id = bmg.group_id
            JOIN materials m ON m.id = mgi.material_id
            WHERE pb.cabinet_id = $1

            UNION ALL

            -- 9. Материалы типов компонентов шкафа
            SELECT 
                ctm.id as link_id,
                m.id as material_id,
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                (COALESCE(ctm.quantity, 1) * COALESCE(pb.quantity, 1))::numeric as quantity,
                TRUE as is_component_material,
                NULL::text as system_name,
                NULL::text as component_name,
                bt.name::text as chain_block_template,
                NULL::text as chain_system_component,
                ct.name::text as chain_type,
                NULL::text as group_name
            FROM project_blocks pb
            JOIN block_templates bt ON bt.id = pb.template_id
            JOIN component_types ct ON ct.id = bt.type_id
            JOIN component_type_materials ctm ON ctm.type_id = ct.id
            JOIN materials m ON m.id = ctm.material_id
            WHERE pb.cabinet_id = $1

            UNION ALL

            -- 10. Материалы из групп типов компонентов шкафа
            SELECT 
                ctmg.group_id as link_id,
                m.id as material_id,
                m.name::text as name,
                m.unit::text as unit,
                m.price,
                m.ln::text as ln,
                m.tm::text as tm,
                (COALESCE(mgi.quantity, 1) * COALESCE(pb.quantity, 1))::numeric as quantity,
                TRUE as is_component_material,
                NULL::text as system_name,
                NULL::text as component_name,
                bt.name::text as chain_block_template,
                NULL::text as chain_system_component,
                ct.name::text as chain_type,
                mg.name::text as group_name
            FROM project_blocks pb
            JOIN block_templates bt ON bt.id = pb.template_id
            JOIN component_types ct ON ct.id = bt.type_id
            JOIN component_type_material_groups ctmg ON ctmg.type_id = ct.id
            JOIN material_groups mg ON mg.id = ctmg.group_id
            JOIN material_group_items mgi ON mgi.group_id = ctmg.group_id
            JOIN materials m ON m.id = mgi.material_id
            WHERE pb.cabinet_id = $1;
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
                SELECT material_id, COALESCE(quantity, 1)::numeric as quantity FROM project_materials WHERE cabinet_id = $1
                UNION ALL
                SELECT mgi.material_id, COALESCE(mgi.quantity, 1)::numeric as quantity FROM cabinet_material_groups cmg JOIN material_group_items mgi ON mgi.group_id = cmg.group_id WHERE cmg.cabinet_id = $1
                UNION ALL
                SELECT scm.material_id, COALESCE(scm.quantity, 1)::numeric as quantity FROM cabinet_systems cs JOIN systems s ON s.id = cs.system_id JOIN system_components_link scl ON scl.system_id = s.id JOIN system_component_materials scm ON scm.system_component_id = scl.component_id WHERE cs.cabinet_id = $1
                UNION ALL
                SELECT mgi.material_id, COALESCE(mgi.quantity, 1)::numeric as quantity FROM cabinet_systems cs JOIN systems s ON s.id = cs.system_id JOIN system_components_link scl ON scl.system_id = s.id JOIN system_component_material_groups scmg ON scmg.component_id = scl.component_id JOIN material_group_items mgi ON mgi.group_id = scmg.group_id WHERE cs.cabinet_id = $1
                UNION ALL
                SELECT sctm.material_id, COALESCE(sctm.quantity, 1)::numeric as quantity FROM cabinet_systems cs JOIN systems s ON s.id = cs.system_id JOIN system_components_link scl ON scl.system_id = s.id JOIN system_components sc ON sc.id = scl.component_id JOIN system_component_type_materials sctm ON sctm.type_id = sc.type_id WHERE cs.cabinet_id = $1
                UNION ALL
                SELECT mgi.material_id, COALESCE(mgi.quantity, 1)::numeric as quantity FROM cabinet_systems cs JOIN systems s ON s.id = cs.system_id JOIN system_components_link scl ON scl.system_id = s.id JOIN system_components sc ON sc.id = scl.component_id JOIN system_component_type_material_groups sctmg ON sctmg.type_id = sc.type_id JOIN material_group_items mgi ON mgi.group_id = sctmg.group_id WHERE cs.cabinet_id = $1
                UNION ALL
                SELECT btm.material_id, (COALESCE(btm.quantity, 1) * COALESCE(pb.quantity, 1))::numeric as quantity FROM project_blocks pb JOIN block_template_materials btm ON btm.block_template_id = pb.template_id WHERE pb.cabinet_id = $1
                UNION ALL
                SELECT mgi.material_id, (COALESCE(mgi.quantity, 1) * COALESCE(pb.quantity, 1))::numeric as quantity FROM project_blocks pb JOIN block_template_material_groups bmg ON bmg.block_template_id = pb.template_id JOIN material_group_items mgi ON mgi.group_id = bmg.group_id WHERE pb.cabinet_id = $1
                UNION ALL
                SELECT ctm.material_id, (COALESCE(ctm.quantity, 1) * COALESCE(pb.quantity, 1))::numeric as quantity FROM project_blocks pb JOIN block_templates bt ON bt.id = pb.template_id JOIN component_type_materials ctm ON ctm.type_id = bt.type_id WHERE pb.cabinet_id = $1
                UNION ALL
                SELECT mgi.material_id, (COALESCE(mgi.quantity, 1) * COALESCE(pb.quantity, 1))::numeric as quantity FROM project_blocks pb JOIN block_templates bt ON bt.id = pb.template_id JOIN component_type_material_groups ctmg ON ctmg.type_id = bt.type_id JOIN material_group_items mgi ON mgi.group_id = ctmg.group_id WHERE pb.cabinet_id = $1
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

// POST /api/materials/cabinet/:id - Добавить материал в шкаф
router.post('/cabinet/:id', auth, isAdmin, async (req, res) => {
    const cabinetId = req.params.id;
    const { material_id, quantity } = req.body;
    try {
        const cabRes = await pool.query('SELECT project_id FROM cabinets WHERE id = $1', [cabinetId]);
        const projectId = cabRes.rows[0]?.project_id || null;
        const result = await pool.query(
            'INSERT INTO project_materials (cabinet_id, project_id, material_id, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
            [cabinetId, projectId, material_id, quantity || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding material to cabinet:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/materials/cabinet/:id/:linkId - Обновить количество
router.put('/cabinet/:id/:linkId', auth, isAdmin, async (req, res) => {
    const { linkId } = req.params;
    const { quantity } = req.body;
    try {
        const result = await pool.query(
            'UPDATE project_materials SET quantity = $1 WHERE id = $2 RETURNING *',
            [quantity, linkId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating cabinet material:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/materials/cabinet/:id/:linkId - Удалить из шкафа
router.delete('/cabinet/:id/:linkId', auth, isAdmin, async (req, res) => {
    const { linkId } = req.params;
    try {
        await pool.query('DELETE FROM project_materials WHERE id = $1', [linkId]);
        res.json({ message: 'Материал удалён из шкафа' });
    } catch (err) {
        console.error('Error deleting cabinet material:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// ========== МАТЕРИАЛЫ СИСТЕМНОГО КОМПОНЕНТА ==========

// GET /api/materials/system-component/:id - Получить материалы системного компонента
router.get('/system-component/:id', auth, async (req, res) => {
    try {
        const direct = await pool.query(
            `SELECT scm.*, m.name, m.article, m.unit, m.price,
                    COALESCE(m.ln, '') AS ln, COALESCE(m.tm, '') AS tm,
                    false as inherited
             FROM system_component_materials scm
             JOIN materials m ON scm.material_id = m.id
             WHERE scm.system_component_id = $1
             ORDER BY m.name`,
            [req.params.id]
        );

        const inherited = await pool.query(
            `SELECT sctm.material_id, sctm.quantity, m.name, m.article, m.unit, m.price,
                    COALESCE(m.ln, '') AS ln, COALESCE(m.tm, '') AS tm,
                    true as inherited
             FROM system_components sc
             JOIN system_component_type_materials sctm ON sc.type_id = sctm.type_id
             JOIN materials m ON sctm.material_id = m.id
             WHERE sc.id = $1
             AND NOT EXISTS (
               SELECT 1 FROM system_component_materials scm2
               WHERE scm2.system_component_id = sc.id AND scm2.material_id = sctm.material_id
             )
             ORDER BY m.name`,
            [req.params.id]
        );

        res.json([...direct.rows, ...inherited.rows]);
    } catch (err) {
        console.error('Error fetching system component materials:', err);
        res.status(500).json({ message: 'Ошибка получения материалов компонента' });
    }
});

// POST /api/materials/system-component/:id - Добавить материал в системный компонент
router.post('/system-component/:id', auth, isAdmin, async (req, res) => {
    const { material_id, quantity } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO system_component_materials (system_component_id, material_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (system_component_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity
             RETURNING *`,
            [req.params.id, material_id, quantity || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding material to system component:', err);
        res.status(500).json({ message: 'Ошибка добавления материала' });
    }
});

// DELETE /api/materials/system-component/:id/:materialId - Удалить материал из системного компонента
router.delete('/system-component/:id/:materialId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM system_component_materials WHERE system_component_id = $1 AND material_id = $2`,
            [req.params.id, req.params.materialId]
        );
        res.json({ message: 'Материал удалён из компонента' });
    } catch (err) {
        console.error('Error deleting material from system component:', err);
        res.status(500).json({ message: 'Ошибка удаления материала' });
    }
});

// ========== ОПЕРАЦИИ СО СПРАВОЧНИКОМ МАТЕРИАЛОВ (CRUD) ==========

// GET /api/materials/:id - Один материал
router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.*, man.name as manufacturer_name 
             FROM materials m
             LEFT JOIN manufacturers man ON m.manufacturer_id = man.id
             WHERE m.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Материал не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching material by ID:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// POST /api/materials - Создать новый материал
router.post('/', auth, isAdmin, async (req, res) => {
    const { article, name, manufacturer_id, description, unit, price, manufacturer_url, ln, tm } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Название материала обязательно' });
    }
    try {
        const posResult = await pool.query('SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM materials');
        const nextPos = posResult.rows[0].next_pos;

        const result = await pool.query(
            `INSERT INTO materials (article, name, manufacturer_id, description, unit, price, manufacturer_url, ln, tm, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                article ? article.trim() : null,
                name.trim(),
                manufacturer_id || null,
                description ? description.trim() : null,
                unit ? unit.trim() : null,
                price !== undefined && price !== null && price !== '' ? parseFloat(price) : null,
                manufacturer_url ? manufacturer_url.trim() : null,
                ln ? ln.trim() : null,
                tm ? tm.trim() : null,
                nextPos
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating material:', err);
        res.status(500).json({ message: 'Ошибка создания материала' });
    }
});

// PUT /api/materials/:id - Обновить материал
router.put('/:id', auth, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { article, name, manufacturer_id, description, unit, price, manufacturer_url, ln, tm } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Название материала обязательно' });
    }
    try {
        const result = await pool.query(
            `UPDATE materials 
             SET article = $1, name = $2, manufacturer_id = $3, description = $4, unit = $5,
                 price = $6, manufacturer_url = $7, ln = $8, tm = $9, updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 RETURNING *`,
            [
                article ? article.trim() : null,
                name.trim(),
                manufacturer_id || null,
                description ? description.trim() : null,
                unit ? unit.trim() : null,
                price !== undefined && price !== null && price !== '' ? parseFloat(price) : null,
                manufacturer_url ? manufacturer_url.trim() : null,
                ln ? ln.trim() : null,
                tm ? tm.trim() : null,
                id
            ]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Материал не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating material:', err);
        res.status(500).json({ message: 'Ошибка обновления материала' });
    }
});

// DELETE /api/materials/:id - Удалить материал из справочника
router.delete('/:id', auth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM materials WHERE id = $1', [id]);
        res.json({ message: 'Материал удалён' });
    } catch (err) {
        console.error('Error deleting material:', err);
        res.status(500).json({ message: 'Ошибка удаления материала' });
    }
});

module.exports = router;