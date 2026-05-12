const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET – список компонентов с параметрами и значениями
router.get('/', async (req, res) => {
  try {
    const tmpls = await pool.query(`
      SELECT bt.*, ct.name AS type_name, m.name AS manufacturer_name
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY bt.name
    `);

    // Для каждого шаблона получаем параметры и значения
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

// POST – создать компонент с параметрами
router.post('/', async (req, res) => {
  const { name, description, type_id, manufacturer_id, article, price, labor, ln, parameters } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tmpl = await client.query(
      `INSERT INTO block_templates (name, description, type_id, manufacturer_id, article, price, labor, ln, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, ln || null, req.user.userId]
    );
    const templateId = tmpl.rows[0].id;

    // parameters: массив { parameter_id, param_value } или { param_name, param_value }
    if (Array.isArray(parameters)) {
      for (const p of parameters) {
        let paramId = p.parameter_id;
        // Если передан param_name, находим/создаём параметр
        if (!paramId && p.param_name && p.param_name.trim()) {
          const exist = await client.query('SELECT id FROM parameters WHERE param_name = $1', [p.param_name.trim()]);
          if (exist.rows.length > 0) {
            paramId = exist.rows[0].id;
          } else {
            const newParam = await client.query('INSERT INTO parameters (param_name) VALUES ($1) RETURNING id', [p.param_name.trim()]);
            paramId = newParam.rows[0].id;
          }
        }
        if (paramId) {
          await client.query(
            'INSERT INTO component_param_values (template_id, parameter_id, param_value) VALUES ($1,$2,$3)',
            [templateId, paramId, p.param_value || '']
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

// PUT – обновить компонент и параметры
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  const { name, description, type_id, manufacturer_id, article, price, labor, ln, parameters } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE block_templates SET name=$1, description=$2, type_id=$3, manufacturer_id=$4, article=$5, price=$6, labor=$7, ln=$8 WHERE id=$9`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, ln || null, req.params.id]
    );
    // Удаляем старые значения параметров
    await client.query('DELETE FROM component_param_values WHERE template_id = $1', [req.params.id]);
    // Вставляем новые
    if (Array.isArray(parameters)) {
      for (const p of parameters) {
        let paramId = p.parameter_id;
        if (!paramId && p.param_name && p.param_name.trim()) {
          const exist = await client.query('SELECT id FROM parameters WHERE param_name = $1', [p.param_name.trim()]);
          if (exist.rows.length > 0) {
            paramId = exist.rows[0].id;
          } else {
            const newParam = await client.query('INSERT INTO parameters (param_name) VALUES ($1) RETURNING id', [p.param_name.trim()]);
            paramId = newParam.rows[0].id;
          }
        }
        if (paramId) {
          await client.query(
            'INSERT INTO component_param_values (template_id, parameter_id, param_value) VALUES ($1,$2,$3)',
            [req.params.id, paramId, p.param_value || '']
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

// Экспорт/импорт можно адаптировать позже, оставим пока без изменений

module.exports = router;
