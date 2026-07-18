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
    const templates = await pool.query(`
      SELECT bt.id, bt.name, bt.article, bt.price, bt.weight_grams, bt.power_watts, bt.ln, bt.url, bt.description,
             ct.name AS type_name, m.name AS manufacturer_name
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY ${['id','name','type_name','manufacturer_name','article','price','weight_grams','power_watts','ln'].includes(sort) ? 'bt.'+sort : 'COALESCE(bt.position, 9999), bt.id'} ${order}
    `);
    const allParams = await pool.query('SELECT id, name FROM parameters ORDER BY id');
    const paramNames = allParams.rows.map(p => p.name);

    const result = await Promise.all(templates.rows.map(async (t) => {
      const params = await pool.query(
        `SELECT p.name, cpv.value FROM component_param_values cpv
         JOIN parameters p ON cpv.param_id = p.id
         WHERE cpv.component_id = $1`, [t.id]
      );
      const row = {
        Тип: t.type_name || '',
        Название: t.name,
        Производитель: t.manufacturer_name || '',
        Артикул: t.article || '',
        Описание: t.description || ''
      };
      paramNames.forEach(pn => { row[pn] = ''; });
      params.rows.forEach(p => { row[p.name] = p.value || ''; });
      row['Цена'] = t.price || '';
      row['Вес'] = t.weight_grams || '';
      row['Q'] = t.power_watts || '';
      row['LN'] = t.ln || '';
      row['Ссылка'] = t.url || '';
      return row;
    }));

    const ws = XLSX.utils.json_to_sheet(result);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Компоненты шкафов');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=block_templates.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка экспорта' }); }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const allParams = await pool.query('SELECT id, name FROM parameters');
    const paramMap = {};
    allParams.rows.forEach(p => { paramMap[p.name] = p.id; });

    const fixedCols = ['Тип', 'Название', 'Производитель', 'Артикул', 'Описание', 'Цена', 'Вес', 'Q', 'LN', 'Ссылка'];

    let imported = 0;
    for (const row of data) {
      try {
        const typeRes = await pool.query('SELECT id FROM component_types WHERE name = $1', [row['Тип']]);
        const manRes = await pool.query('SELECT id FROM manufacturers WHERE name = $1', [row['Производитель']]);

        const article = row['Артикул'] || null;
        let compId;
        if (article) {
          const existing = await pool.query('SELECT id FROM block_templates WHERE article = $1', [article]);
          if (existing.rows.length > 0) {
            compId = existing.rows[0].id;
            await pool.query(
              `UPDATE block_templates SET name=$1, type_id=$2, manufacturer_id=$3, description=$4, price=$5, weight_grams=$6, power_watts=$7, ln=$8, url=$9, updated_at=CURRENT_TIMESTAMP WHERE id=$10`,
              [row['Название'] || '', typeRes.rows[0]?.id || null, manRes.rows[0]?.id || null, row['Описание'] || null, row['Цена'] || null, row['Вес'] || null, row['Q'] || null, row['LN'] || null, row['Ссылка'] || null, compId]
            );
          } else {
            const result = await pool.query(
              `INSERT INTO block_templates (name, type_id, manufacturer_id, article, description, price, weight_grams, power_watts, ln, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
              [row['Название'] || '', typeRes.rows[0]?.id || null, manRes.rows[0]?.id || null, article, row['Описание'] || null, row['Цена'] || null, row['Вес'] || null, row['Q'] || null, row['LN'] || null, row['Ссылка'] || null]
            );
            compId = result.rows[0].id;
          }
        } else {
          const result = await pool.query(
            `INSERT INTO block_templates (name, type_id, manufacturer_id, description, price, weight_grams, power_watts, ln, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [row['Название'] || '', typeRes.rows[0]?.id || null, manRes.rows[0]?.id || null, row['Описание'] || null, row['Цена'] || null, row['Вес'] || null, row['Q'] || null, row['LN'] || null, row['Ссылка'] || null]
          );
          compId = result.rows[0].id;
        }

        await pool.query('DELETE FROM component_param_values WHERE component_id = $1', [compId]);

        for (const key of Object.keys(row)) {
          if (!fixedCols.includes(key) && paramMap[key] && row[key]) {
            await pool.query(
              'INSERT INTO component_param_values (component_id, param_id, value) VALUES ($1, $2, $3)',
              [compId, paramMap[key], String(row[key])]
            );
          }
        }
        imported++;
      } catch (e) { console.error('Ошибка импорта строки:', e); }
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const sort = ['id','name','type_name','manufacturer_name','article','price','weight_grams','power_watts','ln'].includes(req.query.sort) ? req.query.sort : 'id';
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
    const result = await pool.query(`
      SELECT bt.*, ct.name as type_name, m.name as manufacturer_name,
             COALESCE(ln.value, '') AS ln,
             COALESCE(tm.value, '') AS tm,
             EXISTS(SELECT 1 FROM block_template_materials WHERE block_template_id = bt.id) as has_materials,
             COALESCE((SELECT json_agg(json_build_object('id', cpv.id, 'parameter_id', cpv.param_id, 'param_name', p.name, 'param_value', cpv.value))
                       FROM component_param_values cpv
                       LEFT JOIN parameters p ON cpv.param_id = p.id
                       WHERE cpv.component_id = bt.id), '[]'::json) as parameters
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      LEFT JOIN ln_values ln ON ln.entity_type = 'block_template' AND ln.entity_id = bt.id
      LEFT JOIN tm_values tm ON tm.entity_type = 'block_template' AND tm.entity_id = bt.id
      ORDER BY COALESCE(bt.position, 9999), bt.id
    `);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bt.*, ct.name as type_name, m.name as manufacturer_name,
             COALESCE(ln.value, '') AS ln,
             COALESCE(tm.value, '') AS tm,
             EXISTS(SELECT 1 FROM block_template_materials WHERE block_template_id = bt.id) as has_materials,
             COALESCE((SELECT json_agg(json_build_object('id', cpv.id, 'parameter_id', cpv.param_id, 'param_name', p.name, 'param_value', cpv.value))
                       FROM component_param_values cpv
                       LEFT JOIN parameters p ON cpv.param_id = p.id
                       WHERE cpv.component_id = bt.id), '[]'::json) as parameters
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      LEFT JOIN ln_values ln ON ln.entity_type = 'block_template' AND ln.entity_id = bt.id
      LEFT JOIN tm_values tm ON tm.entity_type = 'block_template' AND tm.entity_id = bt.id
      WHERE bt.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
  console.log('POST /api/block-templates body:', JSON.stringify(req.body));
  const { name, type_id, manufacturer_id, article, price, labor, weight_grams, power_watts, ln, tm, url, description, parameters } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const typeId = (type_id != null && type_id !== '') ? parseInt(type_id) : null;
    const manId = (manufacturer_id != null && manufacturer_id !== '') ? parseInt(manufacturer_id) : null;
    let result;
    if (article) {
      const existing = await client.query('SELECT id FROM block_templates WHERE article = $1', [article]);
      if (existing.rows.length > 0) {
        const id = existing.rows[0].id;
        result = await client.query(
          `UPDATE block_templates SET name=$1, type_id=$2, manufacturer_id=$3, price=$4, labor=$5, weight_grams=$6, power_watts=$7, url=$8, description=$9, updated_at=CURRENT_TIMESTAMP
           WHERE id=$10 RETURNING *`,
          [name, typeId, manId, price || null, labor || null, weight_grams || null, power_watts || null, url || null, description || null, id]
        );
        console.log(`Обновлён существующий компонент с article=${article}, id=${id}`);
      } else {
        result = await client.query(
          `INSERT INTO block_templates (name, type_id, manufacturer_id, article, price, labor, weight_grams, power_watts, url, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [name, typeId, manId, article, price || null, labor || null, weight_grams || null, power_watts || null, url || null, description || null]
        );
      }
    } else {
      result = await client.query(
        `INSERT INTO block_templates (name, type_id, manufacturer_id, article, price, labor, weight_grams, power_watts, url, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [name, typeId, manId, article || null, price || null, labor || null, weight_grams || null, power_watts || null, url || null, description || null]
      );
    }

    const newId = result.rows[0].id;

    if (ln !== undefined) {
      await client.query(
        `INSERT INTO ln_values (entity_type, entity_id, value) VALUES ('block_template', $1, $2) ON CONFLICT (entity_type, entity_id) DO UPDATE SET value = EXCLUDED.value`,
        [newId, ln || null]
      );
    }
    if (tm !== undefined) {
      await client.query(
        `INSERT INTO tm_values (entity_type, entity_id, value) VALUES ('block_template', $1, $2) ON CONFLICT (entity_type, entity_id) DO UPDATE SET value = EXCLUDED.value`,
        [newId, tm || null]
      );
    }

    await client.query('DELETE FROM component_param_values WHERE component_id = $1', [newId]);
    if (parameters && Array.isArray(parameters)) {
      for (const p of parameters) {
        if (p.parameter_id) {
          await client.query(
            'INSERT INTO component_param_values (component_id, param_id, value) VALUES ($1, $2, $3)',
            [newId, p.parameter_id, p.param_value || p.value || '']
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка POST /api/block-templates:', err);
    res.status(500).json({ message: 'Ошибка', error: err.message });
  } finally { client.release(); }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { parameters, ln, tm, ...bodyFields } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const allowed = ['name', 'type_id', 'manufacturer_id', 'article', 'price', 'labor', 'weight_grams', 'power_watts', 'url', 'description'];
    const fields = [];
    const values = [];
    let c = 1;
    for (const f of allowed) {
      if (bodyFields[f] !== undefined) {
        let val = bodyFields[f];
        if ((f === 'type_id' || f === 'manufacturer_id') && val === '') val = null;
        fields.push(`${f} = $${c++}`);
        values.push(val);
      }
    }
    let result;
    if (fields.length > 0) {
      values.push(id);
      result = await client.query(`UPDATE block_templates SET ${fields.join(', ')} WHERE id = $${c} RETURNING *`, values);
    } else {
      result = await client.query('SELECT * FROM block_templates WHERE id = $1', [id]);
    }

    // Сохраняем LN и TM в новые таблицы
    if (ln !== undefined) {
      await client.query(
        `INSERT INTO ln_values (entity_type, entity_id, value) VALUES ('block_template', $1, $2) ON CONFLICT (entity_type, entity_id) DO UPDATE SET value = EXCLUDED.value`,
        [id, ln || null]
      );
    }
    if (tm !== undefined) {
      await client.query(
        `INSERT INTO tm_values (entity_type, entity_id, value) VALUES ('block_template', $1, $2) ON CONFLICT (entity_type, entity_id) DO UPDATE SET value = EXCLUDED.value`,
        [id, tm || null]
      );
    }

    await client.query('DELETE FROM component_param_values WHERE component_id = $1', [id]);
    if (parameters && Array.isArray(parameters)) {
      for (const p of parameters) {
        if (p.parameter_id) {
          await client.query(
            'INSERT INTO component_param_values (component_id, param_id, value) VALUES ($1, $2, $3)',
            [id, p.parameter_id, p.param_value || p.value || '']
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка' });
  } finally { client.release(); }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try { await pool.query('DELETE FROM component_param_values WHERE component_id = $1', [req.params.id]); await pool.query('DELETE FROM block_templates WHERE id = $1', [req.params.id]); res.json({ message: 'Удалён' }); }
  catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// ========== МАТЕРИАЛЫ КОМПОНЕНТА ШКАФА ==========

// Получить материалы блока
router.get('/:id/materials', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT btm.*, m.name, m.article, m.unit, m.price, m.manufacturer,
                    COALESCE(ln.value, '') AS ln, COALESCE(tm.value, '') AS tm
             FROM block_template_materials btm
             JOIN materials m ON btm.material_id = m.id
             LEFT JOIN ln_values ln ON ln.entity_type = 'material' AND ln.entity_id = m.id
             LEFT JOIN tm_values tm ON tm.entity_type = 'material' AND tm.entity_id = m.id
             WHERE btm.block_template_id = $1 ORDER BY m.name`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Добавить материал к блоку
router.post('/:id/materials', auth, isAdmin, async (req, res) => {
    try {
        const { material_id, quantity } = req.body;
        const result = await pool.query(
            `INSERT INTO block_template_materials (block_template_id, material_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (block_template_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity
             RETURNING *`,
            [req.params.id, material_id, quantity || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Удалить материал из блока
router.delete('/:blockId/materials/:materialId', auth, isAdmin, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM block_template_materials WHERE block_template_id = $1 AND material_id = $2',
            [req.params.blockId, req.params.materialId]
        );
        res.json({ message: 'Материал удалён из блока' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.put('/sort-order', auth, isAdmin, async (req, res) => {
  try {
    var items = req.body.items;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: 'items required' });
    for (var i = 0; i < items.length; i++) {
      await pool.query('UPDATE block_templates SET position = $1 WHERE id = $2', [items[i].position, items[i].id]);
    }
    res.json({ message: 'ok' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

module.exports = router;


