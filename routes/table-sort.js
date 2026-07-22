const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET - загрузить сортировку/фильтр
router.get('/:tableName', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT sort_order, sort_key, sort_dir, filter_data FROM user_table_sort WHERE user_id = $1 AND table_name = $2',
      [req.user.id, req.params.tableName]
    );
    res.json(result.rows[0] || { sort_order: [], sort_key: null, sort_dir: 'asc', filter_data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка' });
  }
});

// PUT - сохранить сортировку/фильтр
router.put('/:tableName', auth, async (req, res) => {
  try {
    const { sort_order, sort_key, sort_dir, filter_data } = req.body;
    await pool.query(
      `INSERT INTO user_table_sort (user_id, table_name, sort_order, sort_key, sort_dir, filter_data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, table_name)
       DO UPDATE SET sort_order = $3, sort_key = $4, sort_dir = $5, filter_data = $6, updated_at = NOW()`,
      [req.user.id, req.params.tableName, JSON.stringify(sort_order || []), sort_key || null, sort_dir || 'asc', JSON.stringify(filter_data || {})]
    );
    res.json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка' });
  }
});

module.exports = router;
