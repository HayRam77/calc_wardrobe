const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET – присоединяем имена типа и производителя
router.get('/', async (req, res) => {
  try {
    const tmpls = await pool.query(`
      SELECT bt.*, ct.name AS type_name, m.name AS manufacturer_name
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY bt.name
    `);
    res.json(tmpls.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST – принимаем type_id и manufacturer_id
router.post('/', async (req, res) => {
  const { name, description, type_id, manufacturer_id, article, price, labor } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  try {
    const result = await pool.query(
      `INSERT INTO block_templates (name, description, type_id, manufacturer_id, article, price, labor, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Компонент с таким именем уже существует' });
    res.status(500).json({ error: err.message });
  }
});

// PUT – только админ
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только для администратора' });
  const { name, description, type_id, manufacturer_id, article, price, labor } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  try {
    await pool.query(
      `UPDATE block_templates SET name=$1, description=$2, type_id=$3, manufacturer_id=$4, article=$5, price=$6, labor=$7
       WHERE id=$8`,
      [name, description || null, type_id || null, manufacturer_id || null, article || null, price || null, labor || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Компонент с таким именем уже существует' });
    res.status(500).json({ error: err.message });
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
