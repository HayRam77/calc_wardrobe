const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const cabinet = await pool.query(`
      SELECT c.*, p.name AS project_name, p.user_id AS project_owner_id
      FROM cabinets c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1
    `, [id]);
    if (cabinet.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });

    const cab = cabinet.rows[0];
    if (req.user.role !== 'admin' && req.user.userId !== cab.project_owner_id) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    const blocks = await pool.query(`
      SELECT pb.id, pb.block_name, pb.order_index,
             bt.article, bt.description AS template_description,
             ct.name AS type_name, m.name AS manufacturer_name,
             COALESCE(json_agg(json_build_object('param_name', pbp.param_name, 'param_value', pbp.param_value))
                      FILTER (WHERE pbp.param_name IS NOT NULL), '[]') AS parameters
      FROM project_blocks pb
      LEFT JOIN block_templates bt ON pb.template_id = bt.id
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      LEFT JOIN project_block_params pbp ON pbp.project_block_id = pb.id
      WHERE pb.cabinet_id = $1
      GROUP BY pb.id, bt.article, bt.description, ct.name, m.name
      ORDER BY pb.order_index
    `, [id]);

    res.json({
      ...cab,
      blocks: blocks.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
