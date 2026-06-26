const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.project_id, c.created_at,
              p.name AS project_name, u.username AS owner
       FROM cabinets c
       JOIN projects p ON c.project_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cabinets:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, p.name AS project_name
       FROM cabinets c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching cabinet:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, project_id } = req.body;
    const result = await pool.query(
      'INSERT INTO cabinets (name, project_id, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name, project_id, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating cabinet:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'UPDATE cabinets SET name = $1 WHERE id = $2 RETURNING *',
      [name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating cabinet:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cabinets WHERE id = $1', [req.params.id]);
    res.json({ message: 'Шкаф удалён' });
  } catch (err) {
    console.error('Error deleting cabinet:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
