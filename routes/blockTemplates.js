const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/block-templates — Список всех компонентов
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bt.*, ct.name as type_name, m.name as manufacturer_name,
             COALESCE(bt.ln, '') AS ln,
             COALESCE(bt.tm, '') AS tm,
             (
               EXISTS(SELECT 1 FROM block_template_materials WHERE block_template_id = bt.id) OR
               EXISTS(SELECT 1 FROM block_template_material_groups WHERE block_template_id = bt.id)
             ) as has_bindings
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY COALESCE(bt.position, 9999), bt.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения компонентов:', err);
    res.status(500).json({ message: 'Ошибка получения компонентов' });
  }
});

// PUT /api/block-templates/sort-order — Порядок элементов
router.put('/sort-order', auth, isAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: 'items required' });
    for (let i = 0; i < items.length; i++) {
      const id = parseInt(items[i].id);
      const pos = parseInt(items[i].position);
      if (isNaN(id) || isNaN(pos)) continue;
      await pool.query('UPDATE block_templates SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'Порядок сохранён' });
  } catch (err) {
    console.error('Ошибка сортировки:', err);
    res.status(500).json({ message: 'Ошибка сортировки' });
  }
});

// GET /api/block-templates/export — Экспорт Excel
router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bt.id as ID, bt.name as Название, ct.name as Тип, m.name as Производитель, 
             bt.article as Артикул, bt.price as Цена, bt.weight_grams as Вес, 
             bt.power_watts as Мощность, bt.ln as LN, bt.tm as TM,
             bt.url as Ссылка, bt.description as Описание
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY COALESCE(bt.position, 9999), bt.name
    `);
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Компоненты');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=block_templates.xlsx');
    res.send(buffer);
  } catch (err) {
    console.error('Ошибка экспорта:', err);
    res.status(500).json({ message: 'Ошибка экспорта' });
  }
});

// POST /api/block-templates/import — Импорт из Excel
router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try {
        await pool.query(
          `INSERT INTO block_templates (name, article, price, weight_grams, power_watts, ln, tm, url, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [row['Название'], row['Артикул'] || null, row['Цена'] || null, row['Вес'] || null, 
           row['Мощность'] || null, row['LN'] || null, row['TM'] || null, row['Ссылка'] || null, row['Описание'] || null]
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

// ========== МАТЕРИАЛЫ КОМПОНЕНТА ШКАФА ==========

// GET /api/block-templates/:id/materials — Получить список материалов компонента
router.get('/:id/materials', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT btm.*, m.name, m.article, m.unit, m.price,
              COALESCE(m.ln, '') AS ln, COALESCE(m.tm, '') AS tm
       FROM block_template_materials btm
       JOIN materials m ON btm.material_id = m.id
       WHERE btm.block_template_id = $1
       ORDER BY m.name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения материалов компонента шкафа:', err);
    res.status(500).json({ message: 'Ошибка получения материалов' });
  }
});

// POST /api/block-templates/:id/materials — Привязать материал к компоненту
router.post('/:id/materials', auth, isAdmin, async (req, res) => {
  try {
    const { material_id, quantity } = req.body;
    const blockTemplateId = req.params.id;
    const qty = quantity || 1;

    const result = await pool.query(
      `INSERT INTO block_template_materials (block_template_id, material_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (block_template_id, material_id) 
       DO UPDATE SET quantity = EXCLUDED.quantity 
       RETURNING *`,
      [blockTemplateId, material_id, qty]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка привязки материала к компоненту шкафа:', err);
    res.status(500).json({ message: 'Ошибка привязки материала' });
  }
});

// DELETE /api/block-templates/:id/materials/:materialId — Отвязать материал
router.delete('/:id/materials/:materialId', auth, isAdmin, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM block_template_materials 
       WHERE block_template_id = $1 AND (material_id = $2 OR id = $2)`,
      [req.params.id, req.params.materialId]
    );
    res.json({ message: 'Материал отвязан от компонента' });
  } catch (err) {
    console.error('Ошибка отвязки материала:', err);
    res.status(500).json({ message: 'Ошибка отвязки материала' });
  }
});

// ========== ГРУППЫ МАТЕРИАЛОВ КОМПОНЕНТА ШКАФА ==========

// GET /api/block-templates/:id/material-groups — Получить список привязанных групп материалов с их составом
router.get('/:id/material-groups', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bmg.group_id as link_id, mg.id as group_id, mg.name as group_name, mg.description,
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
       FROM block_template_material_groups bmg
       JOIN material_groups mg ON mg.id = bmg.group_id
       LEFT JOIN material_group_items mgi ON mgi.group_id = mg.id
       LEFT JOIN materials m ON m.id = mgi.material_id
       WHERE bmg.block_template_id = $1
       GROUP BY bmg.group_id, mg.id, mg.name, mg.description
       ORDER BY bmg.group_id ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения групп материалов компонента:', err);
    res.status(500).json({ message: 'Ошибка получения групп материалов' });
  }
});

// POST /api/block-templates/:id/material-groups — Привязать группу материалов
router.post('/:id/material-groups', auth, isAdmin, async (req, res) => {
  try {
    const { group_id } = req.body;
    const blockTemplateId = req.params.id;
    if (!group_id) return res.status(400).json({ message: 'group_id обязателен' });

    const result = await pool.query(
      `INSERT INTO block_template_material_groups (block_template_id, group_id)
       SELECT $1, $2
       WHERE NOT EXISTS (
           SELECT 1 FROM block_template_material_groups WHERE block_template_id = $1 AND group_id = $2
       )
       RETURNING *`,
      [blockTemplateId, group_id]
    );
    res.status(201).json(result.rows[0] || { message: 'Привязано' });
  } catch (err) {
    console.error('Ошибка привязки группы материалов:', err);
    res.status(500).json({ message: 'Ошибка привязки группы материалов' });
  }
});

// DELETE /api/block-templates/:id/material-groups/:linkId — Отвязать группу материалов
router.delete('/:id/material-groups/:linkId', auth, isAdmin, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM block_template_material_groups WHERE block_template_id = $1 AND group_id = $2`,
      [req.params.id, req.params.linkId]
    );
    res.json({ message: 'Группа материалов отвязана' });
  } catch (err) {
    console.error('Ошибка отвязки группы материалов:', err);
    res.status(500).json({ message: 'Ошибка отвязки группы материалов' });
  }
});

// GET /api/block-templates/:id — Один компонент
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bt.*, ct.name as type_name, m.name as manufacturer_name,
             COALESCE(bt.ln, '') AS ln, COALESCE(bt.tm, '') AS tm
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      WHERE bt.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
    const comp = result.rows[0];

    const paramsResult = await pool.query(`
      SELECT cpv.param_id as parameter_id, cpv.value as param_value, p.name as parameter_name
      FROM component_param_values cpv
      JOIN parameters p ON cpv.param_id = p.id
      WHERE cpv.component_id = $1
    `, [req.params.id]);

    comp.parameters = paramsResult.rows;
    res.json(comp);
  } catch (err) {
    console.error('Ошибка получения компонента:', err);
    res.status(500).json({ message: 'Ошибка получения компонента' });
  }
});

// POST /api/block-templates — Создание / Обновление компонента
router.post('/', auth, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id, name, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, tm, url, description, parameters } = req.body;

    let block;

    if (id) {
      const updateRes = await client.query(
        `UPDATE block_templates 
         SET name = $1, type_id = $2, manufacturer_id = $3, article = $4, price = $5, weight_grams = $6,
             power_watts = $7, ln = $8, tm = $9, url = $10, description = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 RETURNING *`,
        [name, type_id || null, manufacturer_id || null, article || null, price || null, weight_grams || null, power_watts || null, ln || null, tm || null, url || null, description || null, id]
      );
      if (updateRes.rows.length > 0) block = updateRes.rows[0];
    }

    if (!block && article) {
      const existing = await client.query('SELECT id FROM block_templates WHERE article = $1', [article]);
      if (existing.rows.length > 0) {
        const existingId = existing.rows[0].id;
        const updateRes = await client.query(
          `UPDATE block_templates 
           SET name = $1, type_id = $2, manufacturer_id = $3, price = $4, weight_grams = $5,
               power_watts = $6, ln = $7, tm = $8, url = $9, description = $10, updated_at = CURRENT_TIMESTAMP
           WHERE id = $11 RETURNING *`,
          [name, type_id || null, manufacturer_id || null, price || null, weight_grams || null, power_watts || null, ln || null, tm || null, url || null, description || null, existingId]
        );
        block = updateRes.rows[0];
      }
    }

    if (!block && name) {
      const existingByName = await client.query('SELECT id FROM block_templates WHERE LOWER(name) = LOWER($1)', [name.trim()]);
      if (existingByName.rows.length > 0) {
        const existingId = existingByName.rows[0].id;
        const updateRes = await client.query(
          `UPDATE block_templates 
           SET name = $1, type_id = COALESCE($2, type_id), manufacturer_id = COALESCE($3, manufacturer_id),
               article = COALESCE($4, article), price = COALESCE($5, price), weight_grams = COALESCE($6, weight_grams),
               power_watts = COALESCE($7, power_watts), ln = COALESCE($8, ln), tm = COALESCE($9, tm), url = COALESCE($10, url),
               description = COALESCE($11, description), updated_at = CURRENT_TIMESTAMP
           WHERE id = $12 RETURNING *`,
          [name, type_id || null, manufacturer_id || null, article || null, price || null, weight_grams || null, power_watts || null, ln || null, tm || null, url || null, description || null, existingId]
        );
        block = updateRes.rows[0];
      }
    }

    if (!block) {
      const insertRes = await client.query(
        `INSERT INTO block_templates (name, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, tm, url, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [name, type_id || null, manufacturer_id || null, article || null, price || null, weight_grams || null, power_watts || null, ln || null, tm || null, url || null, description || null]
      );
      block = insertRes.rows[0];
    }

    await client.query('DELETE FROM component_param_values WHERE component_id = $1', [block.id]);
    if (parameters && parameters.length) {
      for (const p of parameters) {
        if (p.parameter_id) {
          await client.query(
            'INSERT INTO component_param_values (component_id, param_id, value) VALUES ($1, $2, $3)',
            [block.id, p.parameter_id, p.param_value || '']
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(block);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка сохранения компонента:', err);
    res.status(500).json({ message: 'Ошибка сохранения компонента' });
  } finally {
    client.release();
  }
});

// PUT /api/block-templates/:id — Редактирование
router.put('/:id', auth, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, tm, url, description, parameters } = req.body;

    const result = await client.query(
      `UPDATE block_templates 
       SET name = COALESCE($1, name), type_id = COALESCE($2, type_id), manufacturer_id = COALESCE($3, manufacturer_id),
           article = COALESCE($4, article), price = COALESCE($5, price), weight_grams = COALESCE($6, weight_grams),
           power_watts = COALESCE($7, power_watts), ln = COALESCE($8, ln), tm = COALESCE($9, tm), url = COALESCE($10, url),
           description = COALESCE($11, description), updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [name, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, tm, url, description, req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Не найден' });
    }

    if (parameters && Array.isArray(parameters)) {
      await client.query('DELETE FROM component_param_values WHERE component_id = $1', [req.params.id]);
      for (const p of parameters) {
        if (p.parameter_id) {
          await client.query(
            'INSERT INTO component_param_values (component_id, param_id, value) VALUES ($1, $2, $3)',
            [req.params.id, p.parameter_id, p.param_value || '']
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка обновления компонента:', err);
    res.status(500).json({ message: 'Ошибка обновления' });
  } finally {
    client.release();
  }
});

// DELETE /api/block-templates/:id
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM component_param_values WHERE component_id = $1', [req.params.id]);
    await pool.query('DELETE FROM block_templates WHERE id = $1', [req.params.id]);
    res.json({ message: 'Удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления' });
  }
});

module.exports = router;