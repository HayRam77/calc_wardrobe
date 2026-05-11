const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

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

module.exports = router;
