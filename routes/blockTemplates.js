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
             COALESCE(bt.tm, '') AS tm
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
    const { name, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, tm, url, description, parameters } = req.body;

    let block;
    if (article) {
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

module.exports = router;