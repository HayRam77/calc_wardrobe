// routes/blockTemplates.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

// Получить все шаблоны блоков
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM block_templates ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шаблонов блоков' });
  }
});

// Получить один шаблон
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM block_templates WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Шаблон не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шаблона' });
  }
});

// Создать шаблон (только админ)
router.post('/', auth, isAdmin, validate([
  body('name').trim().notEmpty().withMessage('Название обязательно'),
  body('description').optional().trim()
]), async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO block_templates (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания шаблона' });
  }
});

// Обновить шаблон (только админ)
router.put('/:id', auth, isAdmin, validate([
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim()
]), async (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];
  let counter = 1;
  for (const field of ['name', 'description']) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = $${counter++}`);
      values.push(req.body[field]);
    }
  }
  if (fields.length === 0) return res.status(400).json({ message: 'Нет данных для обновления' });

  values.push(id);
  try {
    const result = await pool.query(
      `UPDATE block_templates SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Шаблон не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления шаблона' });
  }
});

// Удалить шаблон (только админ)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM block_templates WHERE id = $1', [id]);
    res.json({ message: 'Шаблон удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления шаблона' });
  }
});

module.exports = router;