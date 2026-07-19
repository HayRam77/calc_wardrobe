const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const ownerCheck = require('../middleware/ownerCheck');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

// Получение всех проектов (админ видит все, пользователь – только свои)
router.get('/', auth, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(
        `SELECT p.*, u.username as owner_name
         FROM projects p
         LEFT JOIN users u ON p.user_id = u.id
         ORDER BY p.created_at DESC`
      );
    } else {
      result = await pool.query(
        `SELECT p.*, u.username as owner_name
         FROM projects p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения проектов' });
  }
});

// Получение одного проекта
router.post('/reorder', auth, isAdmin, async (req, res) => {
  try {
    var items = req.body.items;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: 'items required' });
    for (var i = 0; i < items.length; i++) {
      var id = parseInt(items[i].id), pos = parseInt(items[i].position);
      if (isNaN(id) || isNaN(pos)) continue;
      await pool.query('UPDATE projects SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'ok' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, u.username as owner_name
       FROM projects p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения проекта' });
  }
});

// Создание проекта (с валидацией)
router.post('/', auth, validate([
  body('name').trim().notEmpty().withMessage('Название проекта обязательно'),
  body('description').optional().trim()
]), async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      `INSERT INTO projects (name, description, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания проекта' });
  }
});

// Обновление проекта (только владелец или админ)
router.put('/:id', auth, ownerCheck, validate([
  body('name').optional().trim().notEmpty().withMessage('Название не может быть пустым'),
  body('description').optional().trim()
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Динамическое построение запроса, чтобы обновить только переданные поля
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    values.push(id);
    const query = `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления проекта' });
  }
});

// Удаление проекта (только владелец или админ)
router.delete('/:id', auth, ownerCheck, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    res.json({ message: 'Проект удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления проекта' });
  }
});

module.exports = router;