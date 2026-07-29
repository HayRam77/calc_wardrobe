const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id as ID, name as Название, description as Описание FROM system_component_types ORDER BY id');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Типы компонентов систем');
    res.setHeader('Content-Disposition', 'attachment; filename=system_component_types.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка экспорта' }); }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try { await pool.query('INSERT INTO system_component_types (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description=$2', [row['Название'], row['Описание'] || null]); imported++; } catch (e) {}
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

router.get('/', auth, async (req, res) => { 
  try { 
    const sort = ['id','name','description'].includes(req.query.sort) ? req.query.sort : 'name';
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
    const r = await pool.query(
      'SELECT sct.*, ' +
      'EXISTS(SELECT 1 FROM system_component_type_materials WHERE type_id = sct.id) as has_materials, ' +
      'EXISTS(SELECT 1 FROM system_component_type_blocks WHERE type_id = sct.id) as has_blocks ' +
      'FROM system_component_types sct ORDER BY sct.' + sort + ' ' + order
    ); 
    res.json(r.rows); 
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } 
});

router.get('/:id', auth, async (req, res) => { try { const r = await pool.query('SELECT * FROM system_component_types WHERE id = $1', [req.params.id]); if (r.rows.length === 0) return res.status(404).json({ message: 'Не найден' }); res.json(r.rows[0]); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.post('/', auth, isAdmin, async (req, res) => { try { const r = await pool.query('INSERT INTO system_component_types (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description=$2 RETURNING *', [req.body.name, req.body.description || null]); res.status(201).json(r.rows[0]); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.put('/:id', auth, isAdmin, async (req, res) => { try { const r = await pool.query('UPDATE system_component_types SET name=$1, description=$2 WHERE id=$3 RETURNING *', [req.body.name, req.body.description || null, req.params.id]); res.json(r.rows[0]); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.delete('/:id', auth, isAdmin, async (req, res) => { try { await pool.query('DELETE FROM system_component_types WHERE id = $1', [req.params.id]); res.json({ message: 'Удалён' }); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });

// ========== МАТЕРИАЛЫ ТИПА ==========
router.get('/:id/materials', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT scm.*, m.name, m.article, m.unit, m.price,
                    COALESCE(m.ln, '') AS ln, COALESCE(m.tm, '') AS tm
             FROM system_component_type_materials scm
             JOIN materials m ON scm.material_id = m.id
             WHERE scm.type_id = $1 ORDER BY m.name`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/:id/materials', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { material_id, quantity } = req.body;
        const typeId = req.params.id;
        const qty = quantity || 1;

        // Добавляем в тип
        const result = await client.query(
            `INSERT INTO system_component_type_materials (type_id, material_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (type_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity RETURNING *`,
            [typeId, material_id, qty]
        );

        // Авто-подтягивание всем компонентам этого типа
        await client.query(
            `INSERT INTO system_component_materials (system_component_id, material_id, quantity)
             SELECT sc.id, $2, $3
             FROM system_components sc
             WHERE sc.type_id = $1
             ON CONFLICT DO NOTHING`,
            [typeId, material_id, qty]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка' });
    } finally {
        client.release();
    }
});

router.delete('/:typeId/materials/:materialId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM system_component_type_materials WHERE type_id=$1 AND (material_id=$2 OR id=$2)',
            [req.params.typeId, req.params.materialId]);
        res.json({ message: 'Материал удалён из типа' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// ========== ГРУППЫ МАТЕРИАЛОВ ТИПА ==========
router.get('/:id/material-groups', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT smg.id as link_id, mg.id as group_id, mg.name as group_name, mg.description,
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
       FROM system_component_type_material_groups smg
       JOIN material_groups mg ON mg.id = smg.group_id
       LEFT JOIN material_group_items mgi ON mgi.group_id = mg.id
       LEFT JOIN materials m ON m.id = mgi.material_id
       WHERE smg.type_id = $1
       GROUP BY smg.id, mg.id, mg.name, mg.description
       ORDER BY smg.id ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения групп материалов типа:', err);
    res.status(500).json({ message: 'Ошибка получения групп материалов типа' });
  }
});

router.post('/:id/material-groups', auth, isAdmin, async (req, res) => {
  try {
    const { group_id } = req.body;
    const typeId = req.params.id;
    if (!group_id) return res.status(400).json({ message: 'group_id обязателен' });

    const result = await pool.query(
      `INSERT INTO system_component_type_material_groups (type_id, group_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING *`,
      [typeId, group_id]
    );
    res.status(201).json(result.rows[0] || { message: 'Уже привязано' });
  } catch (err) {
    console.error('Ошибка привязки группы материалов к типу:', err);
    res.status(500).json({ message: 'Ошибка привязки группы материалов к типу' });
  }
});

router.delete('/:typeId/material-groups/:linkId', auth, isAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM system_component_type_material_groups WHERE type_id = $1 AND (id = $2 OR group_id = $2)',
      [req.params.typeId, req.params.linkId]
    );
    res.json({ message: 'Группа материалов отвязана от типа' });
  } catch (err) {
    console.error('Ошибка отвязки группы материалов от типа:', err);
    res.status(500).json({ message: 'Ошибка отвязки группы материалов' });
  }
});

// ========== КОМПОНЕНТЫ ШКАФА ТИПА ==========
router.get('/:id/blocks', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT sbl.*, bt.name, bt.article, ct.name AS type_name,
                    COALESCE(bt.ln, '') AS ln, COALESCE(bt.tm, '') AS tm
             FROM system_component_type_blocks sbl
             JOIN block_templates bt ON sbl.block_template_id = bt.id
             LEFT JOIN component_types ct ON bt.type_id = ct.id
             WHERE sbl.type_id = $1 ORDER BY bt.name`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/:id/blocks', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { block_template_id, quantity } = req.body;
        const typeId = req.params.id;
        const qty = quantity || 1;

        // Добавляем в тип
        const result = await client.query(
            `INSERT INTO system_component_type_blocks (type_id, block_template_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (type_id, block_template_id) DO UPDATE SET quantity = EXCLUDED.quantity RETURNING *`,
            [typeId, block_template_id, qty]
        );

        // Авто-подтягивание всем компонентам этого типа
        await client.query(
            `INSERT INTO system_block_links (system_component_id, block_template_id, quantity)
             SELECT sc.id, $2, $3
             FROM system_components sc
             WHERE sc.type_id = $1
             ON CONFLICT DO NOTHING`,
            [typeId, block_template_id, qty]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка' });
    } finally {
        client.release();
    }
});

router.delete('/:typeId/blocks/:blockId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM system_component_type_blocks WHERE type_id=$1 AND (block_template_id=$2 OR id=$2)',
            [req.params.typeId, req.params.blockId]);
        res.json({ message: 'Компонент шкафа удалён из типа' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// ========== КОПИРОВАНИЕ СОСТАВА ТИПА В ДРУГОЙ ТИП ==========
router.post('/:sourceId/copy-to/:targetId', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sourceId = req.params.sourceId;
        const targetId = req.params.targetId;

        const src = await client.query('SELECT id FROM system_component_types WHERE id = $1', [sourceId]);
        const tgt = await client.query('SELECT id FROM system_component_types WHERE id = $1', [targetId]);
        if (src.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Исходный тип не найден' });
        }
        if (tgt.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Целевой тип не найден' });
        }

        await client.query('DELETE FROM system_component_type_materials WHERE type_id = $1', [targetId]);
        await client.query('DELETE FROM system_component_type_material_groups WHERE type_id = $1', [targetId]);
        await client.query('DELETE FROM system_component_type_blocks WHERE type_id = $1', [targetId]);

        const matResult = await client.query(
            `INSERT INTO system_component_type_materials (type_id, material_id, quantity)
             SELECT $1, material_id, quantity FROM system_component_type_materials WHERE type_id = $2`,
            [targetId, sourceId]
        );

        const grpResult = await client.query(
            `INSERT INTO system_component_type_material_groups (type_id, group_id)
             SELECT $1, group_id FROM system_component_type_material_groups WHERE type_id = $2`,
            [targetId, sourceId]
        );

        const blkResult = await client.query(
            `INSERT INTO system_component_type_blocks (type_id, block_template_id, quantity)
             SELECT $1, block_template_id, quantity FROM system_component_type_blocks WHERE type_id = $2`,
            [targetId, sourceId]
        );

        await client.query('COMMIT');
        res.json({ message: 'Состав типа скопирован (материалов: ' + matResult.rowCount + ', групп материалов: ' + grpResult.rowCount + ', блоков: ' + blkResult.rowCount + ')' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Ошибка копирования состава типа' });
    } finally {
        client.release();
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
      await pool.query('UPDATE system_component_types SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'ok' });
  } catch (err) {
    console.error('Ошибка сортировки:', err);
    res.status(500).json({ message: 'Ошибка сортировки' });
  }
});

router.put('/sort-order', auth, isAdmin, async (req, res) => {
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
      await pool.query('UPDATE system_component_types SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'ok' });
  } catch (err) {
    console.error('Ошибка сортировки:', err);
    res.status(500).json({ message: 'Ошибка сортировки' });
  }
});

module.exports = router;