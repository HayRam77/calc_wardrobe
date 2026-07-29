const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Автосоздание таблиц привязок материалов и групп материалов к типам компонентов шкафа
pool.query(`
    CREATE TABLE IF NOT EXISTS component_type_materials (
        id SERIAL PRIMARY KEY,
        type_id INTEGER NOT NULL REFERENCES component_types(id) ON DELETE CASCADE,
        material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        CONSTRAINT unique_ct_m UNIQUE (type_id, material_id)
    );
    CREATE TABLE IF NOT EXISTS component_type_material_groups (
        id SERIAL PRIMARY KEY,
        type_id INTEGER NOT NULL REFERENCES component_types(id) ON DELETE CASCADE,
        group_id INTEGER NOT NULL REFERENCES material_groups(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        CONSTRAINT unique_ct_mg UNIQUE (type_id, group_id)
    );
`).catch(err => console.error('Error initializing component_type tables:', err));

router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id as ID, name as Название, description as Описание FROM component_types ORDER BY id');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Типы компонентов');
    res.setHeader('Content-Disposition', 'attachment; filename=component_types.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка экспорта' }); }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try { await pool.query('INSERT INTO component_types (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description=$2', [row['Название'], row['Описание'] || null]); imported++; } catch (e) {}
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const sort = ['id','name','description'].includes(req.query.sort) ? req.query.sort : 'name';
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
    const r = await pool.query(`
      SELECT ct.*,
             (
               EXISTS(SELECT 1 FROM component_type_materials WHERE type_id = ct.id) OR
               EXISTS(SELECT 1 FROM component_type_material_groups WHERE type_id = ct.id) OR
               EXISTS(SELECT 1 FROM block_templates WHERE type_id = ct.id)
             ) as has_bindings
      FROM component_types ct
      ORDER BY COALESCE(ct.position, 9999), ct.${sort} ${order}
    `);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id', auth, async (req, res) => { try { const r = await pool.query('SELECT * FROM component_types WHERE id = $1', [req.params.id]); if (r.rows.length === 0) return res.status(404).json({ message: 'Не найден' }); res.json(r.rows[0]); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.post('/', auth, isAdmin, async (req, res) => { try { const r = await pool.query('INSERT INTO component_types (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description=$2 RETURNING *', [req.body.name, req.body.description || null]); res.status(201).json(r.rows[0]); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.put('/:id', auth, isAdmin, async (req, res) => { try { const r = await pool.query('UPDATE component_types SET name=$1, description=$2 WHERE id=$3 RETURNING *', [req.body.name, req.body.description || null, req.params.id]); res.json(r.rows[0]); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });
router.delete('/:id', auth, isAdmin, async (req, res) => { try { await pool.query('DELETE FROM component_types WHERE id = $1', [req.params.id]); res.json({ message: 'Удалён' }); } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); } });

// ========== МАТЕРИАЛЫ ТИПА КОМПОНЕНТА ШКАФА ==========
router.get('/:id/materials', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ctm.*, m.name, m.article, m.unit, m.price,
                    COALESCE(m.ln, '') AS ln, COALESCE(m.tm, '') AS tm
             FROM component_type_materials ctm
             JOIN materials m ON ctm.material_id = m.id
             WHERE ctm.type_id = $1 ORDER BY m.name`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка получения материалов типа компонента шкафа' }); }
});

router.post('/:id/materials', auth, isAdmin, async (req, res) => {
    try {
        const { material_id, quantity } = req.body;
        const typeId = req.params.id;
        const qty = quantity || 1;

        const result = await pool.query(
            `INSERT INTO component_type_materials (type_id, material_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (type_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity RETURNING *`,
            [typeId, material_id, qty]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка привязки материала к типу компонента шкафа' }); }
});

router.delete('/:typeId/materials/:materialId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM component_type_materials WHERE type_id=$1 AND (material_id=$2 OR id=$2)',
            [req.params.typeId, req.params.materialId]);
        res.json({ message: 'Материал удалён из типа компонента шкафа' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка удаления материала' }); }
});

// ========== ГРУППЫ МАТЕРИАЛОВ ТИПА КОМПОНЕНТА ШКАФА ==========
router.get('/:id/material-groups', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ctmg.group_id as link_id, mg.id as group_id, mg.name as group_name, mg.description,
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
       FROM component_type_material_groups ctmg
       JOIN material_groups mg ON mg.id = ctmg.group_id
       LEFT JOIN material_group_items mgi ON mgi.group_id = mg.id
       LEFT JOIN materials m ON m.id = mgi.material_id
       WHERE ctmg.type_id = $1
       GROUP BY ctmg.group_id, mg.id, mg.name, mg.description
       ORDER BY ctmg.group_id ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения групп материалов типа компонента шкафа:', err);
    res.status(500).json({ message: 'Ошибка получения групп материалов' });
  }
});

router.post('/:id/material-groups', auth, isAdmin, async (req, res) => {
  try {
    const { group_id } = req.body;
    const typeId = req.params.id;
    if (!group_id) return res.status(400).json({ message: 'group_id обязателен' });

    const result = await pool.query(
      `INSERT INTO component_type_material_groups (type_id, group_id)
       SELECT $1, $2
       WHERE NOT EXISTS (
           SELECT 1 FROM component_type_material_groups WHERE type_id = $1 AND group_id = $2
       )
       RETURNING *`,
      [typeId, group_id]
    );
    res.status(201).json(result.rows[0] || { message: 'Привязано' });
  } catch (err) {
    console.error('Ошибка привязки группы материалов:', err);
    res.status(500).json({ message: 'Ошибка привязки группы материалов' });
  }
});

router.delete('/:typeId/material-groups/:linkId', auth, isAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM component_type_material_groups WHERE type_id = $1 AND group_id = $2',
      [req.params.typeId, req.params.linkId]
    );
    res.json({ message: 'Группа материалов отвязана от типа компонента шкафа' });
  } catch (err) {
    console.error('Ошибка отвязки группы материалов:', err);
    res.status(500).json({ message: 'Ошибка отвязки группы материалов' });
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
      await pool.query('UPDATE component_types SET position = $1 WHERE id = $2', [pos, id]);
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
      await pool.query('UPDATE component_types SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'ok' });
  } catch (err) {
    console.error('Ошибка сортировки:', err);
    res.status(500).json({ message: 'Ошибка сортировки' });
  }
});

module.exports = router;