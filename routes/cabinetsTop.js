const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET — все шкафы с owner
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.project_id, c.created_at, c.updated_at,
              p.name AS project_name, u.username AS owner
       FROM cabinets c
       LEFT JOIN projects p ON c.project_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /:id — один шкаф с блоками
router.get('/:id', async (req, res) => {
  try {
    const cabinet = await pool.query(
      `SELECT c.id, c.name, c.project_id, c.created_at, c.updated_at,
              p.name AS project_name, u.username AS owner
       FROM cabinets c
       LEFT JOIN projects p ON c.project_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (cabinet.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });

    const blocks = await pool.query(
      `SELECT pb.id, pb.block_name, pb.order_index, pb.quantity,
              bt.name AS template_name, bt.article, bt.price, bt.ln,
              ct.name AS type_name, m.name AS manufacturer_name
       FROM project_blocks pb
       LEFT JOIN block_templates bt ON pb.template_id = bt.id
       LEFT JOIN component_types ct ON bt.type_id = ct.id
       LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
       WHERE pb.cabinet_id = $1
       ORDER BY pb.order_index`,
      [req.params.id]
    );

    res.json({ ...cabinet.rows[0], blocks: blocks.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — создать шкаф
router.post('/', async (req, res) => {
  const { project_id, name } = req.body;
  if (!project_id || !name) return res.status(400).json({ error: 'project_id и name обязательны' });
  try {
    const result = await pool.query(
      'INSERT INTO cabinets (project_id, name) VALUES ($1, $2) RETURNING *',
      [project_id, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT — обновить шкаф
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  try {
    const result = await pool.query(
      'UPDATE cabinets SET name=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *',
      [name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE — удалить шкаф
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cabinets WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;