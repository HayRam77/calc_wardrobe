const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET - загрузить сортировку/фильтр пользователя для таблицы
router.get('/:tableName', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT sort_order, sort_key, sort_dir, filter_data FROM user_table_sort WHERE user_id = $1 AND table_name = $2',
      [req.user.id, req.params.tableName]
    );

    if (result.rows.length === 0) {
      return res.json({ sort_order: [], sort_key: null, sort_dir: 'asc', filter_data: {} });
    }

    const row = result.rows[0];
    res.json({
      sort_order: typeof row.sort_order === 'string' ? JSON.parse(row.sort_order) : (row.sort_order || []),
      sort_key: row.sort_key || null,
      sort_dir: row.sort_dir || 'asc',
      filter_data: typeof row.filter_data === 'string' ? JSON.parse(row.filter_data) : (row.filter_data || {})
    });
  } catch (err) {
    console.error('Ошибка получения сортировки таблицы:', err);
    res.status(500).json({ message: 'Ошибка получения настроек таблицы' });
  }
});

// PUT - сохранить сортировку/фильтр пользователя для таблицы
router.put('/:tableName', auth, async (req, res) => {
  try {
    const { sort_order, sort_key, sort_dir, filter_data } = req.body;
    
    await pool.query(
      `INSERT INTO user_table_sort (user_id, table_name, sort_order, sort_key, sort_dir, filter_data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, table_name)
       DO UPDATE SET 
         sort_order = EXCLUDED.sort_order, 
         sort_key = EXCLUDED.sort_key, 
         sort_dir = EXCLUDED.sort_dir, 
         filter_data = EXCLUDED.filter_data, 
         updated_at = NOW()`,
      [
        req.user.id, 
        req.params.tableName, 
        JSON.stringify(sort_order || []), 
        sort_key || null, 
        sort_dir || 'asc', 
        JSON.stringify(filter_data || {})
      ]
    );
    res.json({ message: 'ok' });
  } catch (err) {
    console.error('Ошибка сохранения сортировки таблицы:', err);
    res.status(500).json({ message: 'Ошибка сохранения настроек таблицы' });
  }
});

module.exports = router;