const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', auth, async (req, res) => {
    try {
        const sort = ['id','name','type_name','manufacturer_name','module_name','ln','tm'].includes(req.query.sort) ? req.query.sort : 'name';
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
        
        const query = `
            SELECT sc.*, sct.name as type_name, m.name as manufacturer_name, sm.name as module_name,
                   COALESCE(sc.ln, '') AS ln,
                   COALESCE(sc.tm, '') AS tm,
                   EXISTS(SELECT 1 FROM system_component_params WHERE component_id = sc.id) as has_params,
                   EXISTS(SELECT 1 FROM system_block_links WHERE system_component_id = sc.id) as has_blocks,
                   EXISTS(SELECT 1 FROM system_component_materials WHERE system_component_id = sc.id) as has_materials,
                   COALESCE(
                     (
                       SELECT json_agg(
                         json_build_object(
                           'parameter_id', scp.parameter_id,
                           'name', p.name,
                           'parameter_name', p.name,
                           'value', scp.value,
                           'type', scp.type
                         )
                       )
                       FROM system_component_params scp
                       JOIN system_parameters p ON scp.parameter_id = p.id
                       WHERE scp.component_id = sc.id
                     ), '[]'::json
                   ) as params
            FROM system_components sc
            LEFT JOIN system_component_types sct ON sc.type_id = sct.id
            LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
            LEFT JOIN system_modules sm ON sc.module_id = sm.id
            ORDER BY ${['id','name','type_id','module_id','manufacturer_id','article','description'].includes(sort) ? 'sc.'+sort : sort} ${order}
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { 
        console.error('Ошибка получения системных компонентов:', err); 
        res.status(500).json({ message: 'Ошибка получения компонентов' }); 
    }
});

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
      await pool.query('UPDATE system_components SET position = $1 WHERE id = $2', [pos, id]);
    }

    res.json({ message: 'ok' });
  } catch (err) {
    console.error('Ошибка reorder компонентов:', err);
    res.status(500).json({ message: 'Ошибка сортировки компонентов' });
  }
});

router.get('/export', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sc.id, sc.name, sct.name as type, sc.article, m.name as manufacturer, sc.description,
                   COALESCE(sc.ln, '') AS ln,
                   COALESCE(sc.tm, '') AS tm
            FROM system_components sc
            LEFT JOIN system_component_types sct ON sc.type_id=sct.id
            LEFT JOIN manufacturers m ON sc.manufacturer_id=m.id
            ORDER BY COALESCE(sc.position, 9999), sc.name
        `);
        const ws = XLSX.utils.json_to_sheet(result.rows);
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Компоненты систем');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=system_components.xlsx');
        res.send(buffer);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sc.*, sct.name as type_name, m.name as manufacturer_name, sm.name as module_name,
                   COALESCE(sc.ln, '') AS ln,
                   COALESCE(sc.tm, '') AS tm
            FROM system_components sc
            LEFT JOIN system_component_types sct ON sc.type_id = sct.id
            LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
            LEFT JOIN system_modules sm ON sc.module_id = sm.id
            WHERE sc.id = $1
        `, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
        const comp = result.rows[0];
        const paramsResult = await pool.query(
            `SELECT scp.*, p.name as parameter_name
             FROM system_component_params scp
             JOIN system_parameters p ON scp.parameter_id = p.id
             WHERE scp.component_id = $1`,
            [req.params.id]
        );
        comp.params = paramsResult.rows;
        res.json(comp);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { name, type_id, module_id, manufacturer_id, article, description, ln, tm, params } = req.body;
        const result = await client.query(
            `INSERT INTO system_components (name, type_id, module_id, manufacturer_id, article, description, ln, tm)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [name, type_id||null, module_id||null, manufacturer_id||null, article||null, description||null, ln||null, tm||null]
        );
        const newComp = result.rows[0];

        if (params && params.length) {
            for (const p of params) {
                await client.query(
                    'INSERT INTO system_component_params (component_id, parameter_id, value, type) VALUES ($1,$2,$3,$4)',
                    [newComp.id, p.parameter_id, p.value||null, p.type||null]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(newComp);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка' });
    } finally {
        client.release();
    }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { name, type_id, module_id, manufacturer_id, article, description, ln, tm, params } = req.body;
        const result = await client.query(
            `UPDATE system_components 
             SET name=$1, type_id=$2, module_id=$3, manufacturer_id=$4, article=$5, description=$6, ln=$7, tm=$8, updated_at=CURRENT_TIMESTAMP
             WHERE id=$9 RETURNING *`,
            [name, type_id||null, module_id||null, manufacturer_id||null, article||null, description||null, ln||null, tm||null, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });

        await client.query('DELETE FROM system_component_params WHERE component_id=$1', [req.params.id]);
        if (params && params.length) {
            for (const p of params) {
                await client.query(
                    'INSERT INTO system_component_params (component_id, parameter_id, value, type) VALUES ($1,$2,$3,$4)',
                    [req.params.id, p.parameter_id, p.value||null, p.type||null]
                );
            }
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка' });
    } finally {
        client.release();
    }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM system_components WHERE id=$1', [id]);
        res.json({ message: 'Удалён' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id/blocks', auth, async (req, res) => {
    try {
        const direct = await pool.query(
            `SELECT sbl.*, bt.name, bt.article,
                    COALESCE(bt.ln, '') AS ln,
                    COALESCE(bt.tm, '') AS tm,
                    ct.name as type_name, m.name as manufacturer_name,
                    false as inherited
             FROM system_block_links sbl
             JOIN block_templates bt ON sbl.block_template_id = bt.id
             LEFT JOIN component_types ct ON bt.type_id = ct.id
             LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
             WHERE sbl.system_component_id=$1
             ORDER BY bt.name`,
            [req.params.id]
        );

        const inherited = await pool.query(
            `SELECT sctb.block_template_id as id, sctb.quantity, bt.name, bt.article,
                    COALESCE(bt.ln, '') AS ln,
                    COALESCE(bt.tm, '') AS tm,
                    ct.name as type_name, m.name as manufacturer_name,
                    true as inherited
             FROM system_components sc
             JOIN system_component_type_blocks sctb ON sc.type_id = sctb.type_id
             JOIN block_templates bt ON sctb.block_template_id = bt.id
             LEFT JOIN component_types ct ON bt.type_id = ct.id
             LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
             WHERE sc.id = $1
             AND NOT EXISTS (
               SELECT 1 FROM system_block_links sbl2
               WHERE sbl2.system_component_id = sc.id AND sbl2.block_template_id = sctb.block_template_id
             )
             ORDER BY bt.name`,
            [req.params.id]
        );

        const all = [...direct.rows, ...inherited.rows];
        res.json(all);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/:id/blocks', auth, isAdmin, async (req, res) => {
    try {
        const { block_template_id, quantity } = req.body;
        const result = await pool.query(
            `INSERT INTO system_block_links (system_component_id, block_template_id, quantity)
             VALUES ($1,$2,$3)
             ON CONFLICT (system_component_id, block_template_id) DO UPDATE SET quantity = EXCLUDED.quantity
             RETURNING *`,
            [req.params.id, block_template_id, quantity||1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.put('/:id/blocks/:blockId', auth, isAdmin, async (req, res) => {
    try {
        const { quantity } = req.body;
        const result = await pool.query(
            'UPDATE system_block_links SET quantity=$1 WHERE system_component_id=$2 AND id=$3 RETURNING *',
            [quantity, req.params.id, req.params.blockId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Не найдена' });
        res.json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.delete('/:id/blocks/:blockId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM system_block_links WHERE system_component_id=$1 AND id=$2',
            [req.params.id, req.params.blockId]);
        res.json({ message: 'Удалён' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// ========== ГРУППЫ МАТЕРИАЛОВ СИСТЕМНОГО КОМПОНЕНТА ==========

// GET /api/system-components/:id/material-groups — Получить группы материалов (прямые + наследуемые от типа)
router.get('/:id/material-groups', auth, async (req, res) => {
    try {
        const direct = await pool.query(
            `SELECT scmg.id as link_id, mg.id as group_id, mg.name as group_name, mg.description,
                    false as inherited,
                    COALESCE(
                      json_agg(
                        jsonb_build_object(
                          'material_id', m.id,
                          'name', m.name,
                          'article', m.article,
                          'unit', m.unit,
                          'quantity', mgi.quantity
                        )
                      ) FILTER (WHERE mgi.id IS NOT NULL), '[]'
                    ) as items
             FROM system_component_material_groups scmg
             JOIN material_groups mg ON mg.id = scmg.group_id
             LEFT JOIN material_group_items mgi ON mgi.group_id = mg.id
             LEFT JOIN materials m ON m.id = mgi.material_id
             WHERE scmg.component_id = $1
             GROUP BY scmg.id, mg.id, mg.name, mg.description
             ORDER BY scmg.id ASC`,
            [req.params.id]
        );

        const inherited = await pool.query(
            `SELECT sctmg.id as link_id, mg.id as group_id, mg.name as group_name, mg.description,
                    true as inherited,
                    COALESCE(
                      json_agg(
                        jsonb_build_object(
                          'material_id', m.id,
                          'name', m.name,
                          'article', m.article,
                          'unit', m.unit,
                          'quantity', mgi.quantity
                        )
                      ) FILTER (WHERE mgi.id IS NOT NULL), '[]'
                    ) as items
             FROM system_components sc
             JOIN system_component_type_material_groups sctmg ON sc.type_id = sctmg.type_id
             JOIN material_groups mg ON mg.id = sctmg.group_id
             LEFT JOIN material_group_items mgi ON mgi.group_id = mg.id
             LEFT JOIN materials m ON m.id = mgi.material_id
             WHERE sc.id = $1
             AND NOT EXISTS (
               SELECT 1 FROM system_component_material_groups scmg2
               WHERE scmg2.component_id = sc.id AND scmg2.group_id = sctmg.group_id
             )
             GROUP BY sctmg.id, mg.id, mg.name, mg.description
             ORDER BY sctmg.id ASC`,
            [req.params.id]
        );

        res.json([...direct.rows, ...inherited.rows]);
    } catch (err) {
        console.error('Ошибка получения групп материалов системного компонента:', err);
        res.status(500).json({ message: 'Ошибка получения групп материалов' });
    }
});

// POST /api/system-components/:id/material-groups — Привязать группу материалов
router.post('/:id/material-groups', auth, isAdmin, async (req, res) => {
    try {
        const { group_id } = req.body;
        if (!group_id) return res.status(400).json({ message: 'group_id обязателен' });

        const result = await pool.query(
            `INSERT INTO system_component_material_groups (component_id, group_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING
             RETURNING *`,
            [req.params.id, group_id]
        );
        res.status(201).json(result.rows[0] || { message: 'Уже привязано' });
    } catch (err) {
        console.error('Ошибка привязки группы материалов к системному компоненту:', err);
        res.status(500).json({ message: 'Ошибка привязки группы материалов' });
    }
});

// DELETE /api/system-components/:id/material-groups/:linkId — Отвязать группу материалов
router.delete('/:id/material-groups/:linkId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM system_component_material_groups WHERE id = $1 AND component_id = $2',
            [req.params.linkId, req.params.id]
        );
        res.json({ message: 'Группа материалов отвязана' });
    } catch (err) {
        console.error('Ошибка отвязки группы материалов:', err);
        res.status(500).json({ message: 'Ошибка отвязки группы материалов' });
    }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
    try {
        const wb = XLSX.read(req.file.buffer, { type:'buffer' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(
                    `INSERT INTO system_components (name, article, description, ln, tm)
                     VALUES ($1,$2,$3,$4,$5)`,
                    [row['название']||row['name'], row['артикул']||null, row['описание']||null, row['ln']||row['LN']||null, row['tm']||row['TM']||null]
                );
                imported++;
            } catch (e) { console.error(e); }
        }
        res.json({ message: 'Импортировано '+imported+' записей' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/:id/duplicate', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;

        const comp = await client.query('SELECT * FROM system_components WHERE id = $1', [id]);
        if (comp.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Компонент не найден' });
        }
        const src = comp.rows[0];

        const newComp = await client.query(
            `INSERT INTO system_components (name, type_id, module_id, manufacturer_id, article, description, ln, tm)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [src.name + ' (копия)', src.type_id, src.module_id, src.manufacturer_id, src.article, src.description, src.ln, src.tm]
        );
        const newId = newComp.rows[0].id;

        await client.query(
            `INSERT INTO system_component_params (component_id, parameter_id, value, type)
             SELECT $1, parameter_id, value, type FROM system_component_params WHERE component_id = $2`,
            [newId, id]
        );

        await client.query(
            `INSERT INTO system_component_materials (system_component_id, material_id, quantity)
             SELECT $1, material_id, quantity FROM system_component_materials WHERE system_component_id = $2`,
            [newId, id]
        );

        await client.query(
            `INSERT INTO system_component_material_groups (component_id, group_id)
             SELECT $1, group_id FROM system_component_material_groups WHERE component_id = $2`,
            [newId, id]
        );

        await client.query(
            `INSERT INTO system_block_links (system_component_id, block_template_id, quantity)
             SELECT $1, block_template_id, quantity FROM system_block_links WHERE system_component_id = $2`,
            [newId, id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Компонент скопирован (ID: ' + newId + ')' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка копирования' });
    } finally {
        client.release();
    }
});

module.exports = router;