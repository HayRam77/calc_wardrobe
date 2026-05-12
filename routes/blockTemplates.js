const XLSX = require('xlsx');
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET – список компонентов с параметрами
router.get('/', async (req, res) => {
  try {
    const tmpls = await pool.query(`
      SELECT bt.id, bt.name, bt.description, bt.type_id, bt.manufacturer_id,
             bt.article, bt.price, bt.labor, bt.ln, bt.url, bt.created_by, bt.created_at,
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
  const { name, description, type_id, manufacturer_id, article, price, labor, ln, url, parameters } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tmpl = await client.query(
      `INSERT INTO block_templates (name, description, type_id, manufacturer_id, article, price, labor, ln, url, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, ln || null, url || null, req.user.userId]
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
  const { name, description, type_id, manufacturer_id, article, price, labor, ln, url, parameters } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE block_templates SET name=$1, description=$2, type_id=$3, manufacturer_id=$4,
       article=$5, price=$6, labor=$7, ln=$8, url=$9 WHERE id=$10`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, ln || null, url || null, req.params.id]
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

router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  try {
    await pool.query('DELETE FROM block_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

// Экспорт компонентов в Excel
router.get('/export', async (req, res) => {
  try {
    const tmpls = await pool.query(`
      SELECT bt.name, ct.name AS type_name, m.name AS manufacturer_name,
             bt.article, bt.description, bt.price, bt.labor, bt.ln, bt.url,
             COALESCE(json_agg(json_build_object('param_name', p.param_name, 'param_value', cpv.param_value))
                      FILTER (WHERE p.param_name IS NOT NULL), '[]') AS parameters
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      LEFT JOIN component_param_values cpv ON cpv.template_id = bt.id
      LEFT JOIN parameters p ON cpv.parameter_id = p.id
      GROUP BY bt.id, ct.name, m.name
      ORDER BY bt.name
    `);
    const rows = tmpls.rows.map(t => ({
      'Название': t.name,
      'Тип': t.type_name || '',
      'Производитель': t.manufacturer_name || '',
      'Артикул': t.article || '',
      'Описание': t.description || '',
      'Цена, руб.': t.price,
      'LN': t.ln || '',
      'Ссылка': t.url || '',
      'Трудозатраты, мин.': t.labor,
      'Параметры': Array.isArray(t.parameters) && t.parameters.length > 0 
        ? t.parameters.map(p => `${p.param_name}=${p.param_value}`).join('; ') 
        : ''
    }));
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

// Импорт компонентов из Excel
router.post('/import', async (req, res) => {
  try {
    if (!req.files || !req.files.file) return res.status(400).json({ error: 'Файл не загружен' });
    const file = req.files.file;
    const workbook = XLSX.read(file.data, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    let added = 0;
    for (const row of data) {
      const name = row['Название'] || row['name'] || '';
      if (!name) continue;
      const typeName = row['Тип'] || '';
      const manufacturerName = row['Производитель'] || '';
      const article = row['Артикул'] || '';
      const description = row['Описание'] || '';
      const price = parseFloat(row['Цена, руб.']) || null;
      const ln = row['LN'] || '';
      const url = row['Ссылка'] || '';
      const labor = parseInt(row['Трудозатраты, мин.']) || null;
      const paramsStr = row['Параметры'] || '';

      // Ищем или создаём тип
      let typeId = null;
      if (typeName) {
        const t = await pool.query('SELECT id FROM component_types WHERE name = $1', [typeName]);
        if (t.rows.length > 0) typeId = t.rows[0].id;
      }
      // Ищем или создаём производителя
      let manufacturerId = null;
      if (manufacturerName) {
        const m = await pool.query('SELECT id FROM manufacturers WHERE name = $1', [manufacturerName]);
        if (m.rows.length > 0) manufacturerId = m.rows[0].id;
      }

      // Вставляем шаблон (если артикул уже есть, пропускаем)
      const ins = await pool.query(
        `INSERT INTO block_templates (name, type_id, manufacturer_id, article, description, price, ln, url, labor, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (article) DO NOTHING RETURNING id`,
        [name, typeId, manufacturerId, article, description, price, ln, url, labor, req.user.userId]
      );
      if (ins.rows.length > 0) {
        const templateId = ins.rows[0].id;
        // Параметры
        if (paramsStr) {
          const paramPairs = paramsStr.split(';').map(s => s.trim()).filter(s => s.includes('='));
          for (const pair of paramPairs) {
            const [key, ...valArr] = pair.split('=');
            const value = valArr.join('=').trim();
            const paramName = key.trim();
            if (paramName) {
              let paramId = null;
              const existParam = await pool.query('SELECT id FROM parameters WHERE param_name = $1', [paramName]);
              if (existParam.rows.length > 0) paramId = existParam.rows[0].id;
              else {
                const newParam = await pool.query('INSERT INTO parameters (param_name) VALUES ($1) RETURNING id', [paramName]);
                paramId = newParam.rows[0].id;
              }
              await pool.query('INSERT INTO component_param_values (template_id, parameter_id, param_value) VALUES ($1,$2,$3)',
                [templateId, paramId, value]);
            }
          }
        }
        added++;
      }
    }
    res.json({ added, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
