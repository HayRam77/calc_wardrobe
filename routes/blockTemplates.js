const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const XLSX = require('xlsx');

router.use(authMiddleware);

// GET – список компонентов с параметрами
router.get('/', async (req, res) => {
  try {
    const tmpls = await pool.query(`
      SELECT bt.id, bt.name, bt.description, bt.type_id, bt.manufacturer_id,
             bt.article, bt.price, bt.labor, bt.ln, bt.url, bt.weight_grams, bt.power_watts, bt.created_by, bt.created_at,
             ct.name AS type_name, m.name AS manufacturer_name
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY bt.name
    `);
    const result = [];
    for (const t of tmpls.rows) {
      const params = await pool.query(`
        SELECT p.param_name, cpv.param_value, p.id AS parameter_id
        FROM component_param_values cpv
        JOIN parameters p ON cpv.parameter_id = p.id
        WHERE cpv.template_id = $1
        ORDER BY p.param_name
      `, [t.id]);
      result.push({ ...t, parameters: params.rows });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST – создание компонента
router.post('/', async (req, res) => {
  const { name, description, type_id, manufacturer_id, article, price, labor, ln, url, weight_grams, power_watts, parameters } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tmpl = await client.query(
      `INSERT INTO block_templates (name, description, type_id, manufacturer_id, article, price, labor, ln, url, weight_grams, power_watts, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, ln || null, url || null, weight_grams || null, power_watts || null, req.user.userId]
    );
    const templateId = tmpl.rows[0].id;
    if (Array.isArray(parameters)) {
      for (const p of parameters) {
        let paramId = p.parameter_id;
        if (!paramId && p.param_name && p.param_name.trim()) {
          const exist = await client.query('SELECT id FROM parameters WHERE param_name = $1', [p.param_name.trim()]);
          if (exist.rows.length > 0) paramId = exist.rows[0].id;
          else {
            const newParam = await client.query('INSERT INTO parameters (param_name) VALUES ($1) RETURNING id', [p.param_name.trim()]);
            paramId = newParam.rows[0].id;
          }
        }
        if (paramId) {
          await client.query('INSERT INTO component_param_values (template_id, parameter_id, param_value) VALUES ($1,$2,$3)',
            [templateId, paramId, p.param_value || '']);
        }
      }
    }
    await client.query('COMMIT');
    res.status(201).json(tmpl.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      if (err.constraint === 'block_templates_article_key') return res.status(400).json({ error: 'Компонент с таким артикулом уже существует' });
      return res.status(400).json({ error: 'Дублирование данных' });
    }
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// PUT – обновление компонента
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  const { name, description, type_id, manufacturer_id, article, price, labor, ln, url, weight_grams, power_watts, parameters } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE block_templates SET name=$1, description=$2, type_id=$3, manufacturer_id=$4,
       article=$5, price=$6, labor=$7, ln=$8, url=$9, weight_grams=$10, power_watts=$11 WHERE id=$12`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, ln || null, url || null, weight_grams || null, power_watts || null, req.params.id]
    );
    await client.query('DELETE FROM component_param_values WHERE template_id = $1', [req.params.id]);
    if (Array.isArray(parameters)) {
      for (const p of parameters) {
        let paramId = p.parameter_id;
        if (!paramId && p.param_name && p.param_name.trim()) {
          const exist = await client.query('SELECT id FROM parameters WHERE param_name = $1', [p.param_name.trim()]);
          if (exist.rows.length > 0) paramId = exist.rows[0].id;
          else {
            const newParam = await client.query('INSERT INTO parameters (param_name) VALUES ($1) RETURNING id', [p.param_name.trim()]);
            paramId = newParam.rows[0].id;
          }
        }
        if (paramId) {
          await client.query('INSERT INTO component_param_values (template_id, parameter_id, param_value) VALUES ($1,$2,$3)',
            [req.params.id, paramId, p.param_value || '']);
        }
      }
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      if (err.constraint === 'block_templates_article_key') return res.status(400).json({ error: 'Компонент с таким артикулом уже существует' });
      return res.status(400).json({ error: 'Дублирование данных' });
    }
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// DELETE – удаление компонента
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
             bt.article, bt.price, bt.weight_grams, bt.power_watts, bt.ln, bt.url, bt.description
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY bt.name
    `);

    const allParams = await pool.query('SELECT id, param_name FROM parameters ORDER BY param_name');
    const paramNames = allParams.rows.map(p => p.param_name);

    const data = [];
    for (const t of tmpls.rows) {
      const row = {
        'Тип': t.type_name || '',
        'Название': t.name || '',
        'Производитель': t.manufacturer_name || '',
        'Артикул': t.article || '',
        'Цена, руб.': t.price || '',
        'Вес, гр.': t.weight_grams || '',
        'Q, вт': t.power_watts || '',
        'LN': t.ln || '',
        'Ссылка': t.url || '',
        'Описание': t.description || ''
      };

      const params = await pool.query(
        'SELECT p.param_name, cpv.param_value FROM component_param_values cpv JOIN parameters p ON cpv.parameter_id = p.id WHERE cpv.template_id = (SELECT id FROM block_templates WHERE name = $1 LIMIT 1)',
        [t.name]
      );
      params.rows.forEach(p => { row[p.param_name] = p.param_value || ''; });

      data.push(row);
    }

    const ws = XLSX.utils.json_to_sheet(data);
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
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  try {
    if (!req.files || !req.files.file) return res.status(400).json({ error: 'Файл не загружен' });
    const file = req.files.file;
    const workbook = XLSX.read(file.data, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const allParams = await pool.query('SELECT id, param_name FROM parameters');
    const paramMap = {};
    allParams.rows.forEach(p => { paramMap[p.param_name] = p.id; });

    const staticCols = ['Тип', 'Название', 'Производитель', 'Артикул', 'Цена, руб.', 'Вес, гр.', 'Q, вт', 'LN', 'Ссылка', 'Описание'];

    let added = 0;
    const client = await pool.connect();
    try {
      for (const row of data) {
        const name = row['Название'];
        if (!name) continue;

        const typeName = row['Тип'] || null;
        const manufacturerName = row['Производитель'] || null;
        const article = row['Артикул'] || null;
        const price = row['Цена, руб.'] || null;
        const weight = row['Вес, гр.'] || null;
        const power = row['Q, вт'] || null;
        const ln = row['LN'] || null;
        const url = row['Ссылка'] || null;
        const description = row['Описание'] || null;

        let typeId = null;
        if (typeName) {
          const t = await client.query('SELECT id FROM component_types WHERE name = $1', [typeName]);
          if (t.rows.length > 0) typeId = t.rows[0].id;
          else { const nt = await client.query('INSERT INTO component_types (name) VALUES ($1) RETURNING id', [typeName]); typeId = nt.rows[0].id; }
        }

        let manufacturerId = null;
        if (manufacturerName) {
          const m = await client.query('SELECT id FROM manufacturers WHERE name = $1', [manufacturerName]);
          if (m.rows.length > 0) manufacturerId = m.rows[0].id;
          else { const nm = await client.query('INSERT INTO manufacturers (name) VALUES ($1) RETURNING id', [manufacturerName]); manufacturerId = nm.rows[0].id; }
        }

        const tmpl = await client.query(
          `INSERT INTO block_templates (name, description, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, url, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (article) DO UPDATE SET name=$1, description=$2, type_id=$3, manufacturer_id=$4, price=$6, weight_grams=$7, power_watts=$8, ln=$9, url=$10
           RETURNING id`,
          [name, description, typeId, manufacturerId, article, price, weight, power, ln, url, req.user.userId]
        );
        const templateId = tmpl.rows[0].id;

        for (const key of Object.keys(row)) {
          if (staticCols.includes(key)) continue;
          const value = row[key];
          if (value === undefined || value === null || value === '') continue;

          let paramId = paramMap[key];
          if (!paramId) {
            const np = await client.query('INSERT INTO parameters (param_name) VALUES ($1) ON CONFLICT (param_name) DO UPDATE SET param_name=$1 RETURNING id', [key]);
            paramId = np.rows[0].id;
            paramMap[key] = paramId;
          }

          await client.query(
            'INSERT INTO component_param_values (template_id, parameter_id, param_value) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [templateId, paramId, String(value)]
          );
        }
        added++;
      }
      res.json({ added, total: data.length });
    } finally { client.release(); }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;