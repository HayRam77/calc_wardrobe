const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Получить все шкафы проекта
router.get('/', async (req, res) => {
  const projectId = req.params.projectId;
  try {
    const result = await pool.query(
      'SELECT * FROM cabinets WHERE project_id = $1 ORDER BY id',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать новый шкаф в проекте
router.post('/', async (req, res) => {
  const projectId = req.params.projectId;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Название шкафа обязательно' });
  
  try {
    const result = await pool.query(
      'INSERT INTO cabinets (project_id, name) VALUES ($1, $2) RETURNING *',
      [projectId, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Код ошибки уникальности в PostgreSQL
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Шкаф с таким названием уже существует в этом проекте' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Обновить название шкафа
router.put('/:cabinetId', async (req, res) => {
  const { name } = req.body;
  const { projectId, cabinetId } = req.params;
  if (!name) return res.status(400).json({ error: 'Название шкафа обязательно' });
  try {
    const result = await pool.query(
      'UPDATE cabinets SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND project_id = $3 RETURNING *',
      [name, cabinetId, projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Шкаф с таким названием уже существует в этом проекте' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Удалить шкаф
router.delete('/:cabinetId', async (req, res) => {
  const { projectId, cabinetId } = req.params;
  try {
    await pool.query('DELETE FROM project_blocks WHERE cabinet_id = $1', [cabinetId]);
    await pool.query('DELETE FROM cabinets WHERE id = $1 AND project_id = $2', [cabinetId, projectId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
