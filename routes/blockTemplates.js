const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const XLSX = require('xlsx');

router.use(authMiddleware);

// GET / – список компонентов с параметрами
router.get('/', async (req, res) => {
  try {
    const tmpls = await pool.query(`
      SELECT bt.id, bt.name, bt.description, bt.type_id, bt.manufacturer_id,
             bt.article, bt.price, bt.labor, bt.created_by, bt.created_at,
             ct.name AS type_name, m.name AS manufacturer_name
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY bt.name
    `);
    const result = [];
    for (const t of tmpls.rows) {
      const params = await pool.query(
        'SELECT param_name, param_value FROM block_parameters WHERE template_id = $1 ORDER BY id',
        [t.id]
      );
      result.push({ ...t, parameters: params.rows });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST / – создание компонента с параметрами
router.post('/', async (req, res) => {
  const { name, description, type_id, manufacturer_id, article, price, labor, parameters } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tmpl = await client.query(
      `INSERT INTO block_templates (name, description, type_id, manufacturer_id, article, price, labor, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, req.user.userId]
    );
    const templateId = tmpl.rows[0].id;
    if (Array.isArray(parameters)) {
      for (const p of parameters) {
        if (p.param_name && p.param_name.trim()) {
          await client.query(
            'INSERT INTO block_parameters (template_id, param_name, param_value) VALUES ($1, $2, $3)',
            [templateId, p.param_name.trim(), p.param_value || '']
          );
        }
      }
    }
    await client.query('COMMIT');
    res.status(201).json(tmpl.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'Компонент с таким именем уже существует' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /:id – обновление компонента
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  const { name, description, type_id, manufacturer_id, article, price, labor, parameters } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE block_templates SET name=$1, description=$2, type_id=$3, manufacturer_id=$4, article=$5, price=$6, labor=$7
       WHERE id=$8`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, req.params.id]
    );
    await client.query('DELETE FROM block_parameters WHERE template_id = $1', [req.params.id]);
    if (Array.isArray(parameters)) {
      for (const p of parameters) {
        if (p.param_name && p.param_name.trim()) {
          await client.query(
            'INSERT INTO block_parameters (template_id, param_name, param_value) VALUES ($1, $2, $3)',
            [req.params.id, p.param_name.trim(), p.param_value || '']
          );
        }
      }
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'Компонент с таким именем уже существует' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  try {
    await pool.query('DELETE FROM block_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Экспорт в Excel
router.get('/export', async (req, res) => {
  try {
    const tmpls = await pool.query(`
      SELECT bt.name, ct.name AS type_name, m.name AS manufacturer_name,
             bt.article, bt.description, bt.price, bt.labor
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY bt.name
    `);
    // Для каждого компонента соберём параметры в JSON
    const rows = [];
    for (const t of tmpls.rows) {
      const params = await pool.query(
        'SELECT param_name, param_value FROM block_parameters WHERE template_id = (SELECT id FROM block_templates WHERE name = $1 LIMIT 1)',
        [t.name]
      );
      rows.push({
        ...t,
        parameters: params.rows.length > 0 ? JSON.stringify(params.rows) : ''
      });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Компоненты');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="components.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Импорт из Excel
router.post('/import', async (req, res) => {
  try {
    if (!req.files || !req.files.file) return res.status(400).json({ error: 'Файл не загружен' });
    const file = req.files.file;
    const workbook = XLSX.read(file.data, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    let added = 0;
    for (const row of data) {
      const name = row.name || row['name'] || '';
      if (!name) continue;
      // Пытаемся вставить, если ошибка уникальности – пропускаем
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const ins = await client.query(
          `INSERT INTO block_templates (name, description, article, price, labor, type_id, manufacturer_id, created_by)
           VALUES ($1,$2,$3,$4,$5,
                   (SELECT id FROM component_types WHERE name = $6 LIMIT 1),
                   (SELECT id FROM manufacturers WHERE name = $7 LIMIT 1),
                   $8)
           ON CONFLICT (name) DO NOTHING RETURNING id`,
          [name, row.description || null, row.article || null, row.price || null, row.labor || null,
           row.type_name || null, row.manufacturer_name || null, req.user.userId]
        );
        if (ins.rows.length > 0) {
          const templateId = ins.rows[0].id;
          // Параметры парсим из JSON
          if (row.parameters) {
            try {
              const params = JSON.parse(row.parameters);
              if (Array.isArray(params)) {
                for (const p of params) {
                  if (p.param_name && p.param_name.trim()) {
                    await client.query(
                      'INSERT INTO block_parameters (template_id, param_name, param_value) VALUES ($1,$2,$3)',
                      [templateId, p.param_name.trim(), p.param_value || '']
                    );
                  }
                }
              }
            } catch(e) {}
          }
          added++;
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    }
    res.json({ added, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
