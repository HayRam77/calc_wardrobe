const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Получить все шаблоны с параметрами
router.get('/', async (req, res) => {
  try {
    const templates = await pool.query('SELECT * FROM block_templates ORDER BY name');
    const result = [];
    for (const t of templates.rows) {
      const params = await pool.query(
        'SELECT id, param_name, param_value, display_order FROM block_parameters WHERE template_id = $1 ORDER BY display_order',
        [t.id]
      );
      result.push({ ...t, parameters: params.rows });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать шаблон
router.post('/', async (req, res) => {
  const { name, description, parameters } = req.body; // parameters: [{ param_name, param_value, display_order }]
  if (!name) return res.status(400).json({ error: 'Имя шаблона обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tmpl = await client.query(
      'INSERT INTO block_templates (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.userId]
    );
    const templateId = tmpl.rows[0].id;
    if (parameters && parameters.length > 0) {
      for (const p of parameters) {
        await client.query(
          'INSERT INTO block_parameters (template_id, param_name, param_value, display_order) VALUES ($1, $2, $3, $4)',
          [templateId, p.param_name, p.param_value || '', p.display_order || 0]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(tmpl.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Удалить шаблон
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM block_templates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
