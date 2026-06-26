const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { body, param } = require('express-validator');
const validate = require('../middleware/validation');

// Получение всех шкафов проекта
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Проверяем доступ: админ видит все, пользователь — только свои проекты
    if (req.user.role !== 'admin') {
      const project = await pool.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
      if (project.rows.length === 0 || project.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Нет доступа к этому проекту' });
      }
    }

    const result = await pool.query(
      `SELECT c.*, 
              COALESCE(SUM(comp.price * comp.quantity), 0) as total_price
       FROM cabinets c
       LEFT JOIN components comp ON c.id = comp.cabinet_id
       WHERE c.project_id = $1
       GROUP BY c.id
       ORDER BY c.created_at`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шкафов' });
  }
});

// Получение одного шкафа
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, p.user_id as project_owner
       FROM cabinets c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Шкаф не найден' });
    }

    const cabinet = result.rows[0];
    // Проверка доступа
    if (req.user.role !== 'admin' && cabinet.project_owner !== req.user.id) {
      return res.status(403).json({ message: 'Нет доступа' });
    }

    res.json(cabinet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шкафа' });
  }
});

// Создание шкафа
router.post('/', auth, validate([
  body('name').trim().notEmpty().withMessage('Название шкафа обязательно'),
  body('project_id').isInt({ min: 1 }).withMessage('Укажите корректный ID проекта'),
  body('description').optional().trim(),
  body('width').optional().isFloat({ min: 0 }).withMessage('Ширина должна быть положительным числом'),
  body('height').optional().isFloat({ min: 0 }).withMessage('Высота должна быть положительным числом'),
  body('depth').optional().isFloat({ min: 0 }).withMessage('Глубина должна быть положительным числом')
]), async (req, res) => {
  try {
    const { name, description, project_id, width, height, depth } = req.body;

    // Проверяем, что проект принадлежит пользователю (или админ)
    if (req.user.role !== 'admin') {
      const project = await pool.query('SELECT user_id FROM projects WHERE id = $1', [project_id]);
      if (project.rows.length === 0 || project.rows[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Нет прав на добавление шкафа в этот проект' });
      }
    }

    const result = await pool.query(
      `INSERT INTO cabinets (name, description, project_id, width, height, depth, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description || null, project_id, width || null, height || null, depth || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания шкафа' });
  }
});

// Обновление шкафа (только владелец проекта или админ)
router.put('/:id', auth, validate([
  param('id').isInt().withMessage('Некорректный ID'),
  body('name').optional().trim().notEmpty().withMessage('Название не может быть пустым'),
  body('description').optional().trim(),
  body('width').optional().isFloat({ min: 0 }),
  body('height').optional().isFloat({ min: 0 }),
  body('depth').optional().isFloat({ min: 0 })
]), async (req, res) => {
  try {
    const { id } = req.params;

    // Проверка принадлежности шкафа к проекту текущего пользователя
    const cabinet = await pool.query(
      `SELECT c.id, p.user_id as project_owner
       FROM cabinets c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [id]
    );
    if (cabinet.rows.length === 0) {
      return res.status(404).json({ message: 'Шкаф не найден' });
    }
    if (req.user.role !== 'admin' && cabinet.rows[0].project_owner !== req.user.id) {
      return res.status(403).json({ message: 'Нет прав на изменение шкафа' });
    }

    const fields = [];
    const values = [];
    let counter = 1;

    for (const field of ['name', 'description', 'width', 'height', 'depth']) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = $${counter++}`);
        values.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    values.push(id);
    const query = `UPDATE cabinets SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *`;
    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления шкафа' });
  }
});

// Удаление шкафа (только владелец проекта или админ)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Проверка прав
    const cabinet = await pool.query(
      `SELECT c.id, p.user_id as project_owner
       FROM cabinets c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [id]
    );
    if (cabinet.rows.length === 0) {
      return res.status(404).json({ message: 'Шкаф не найден' });
    }
    if (req.user.role !== 'admin' && cabinet.rows[0].project_owner !== req.user.id) {
      return res.status(403).json({ message: 'Нет прав на удаление шкафа' });
    }

    await pool.query('DELETE FROM cabinets WHERE id = $1', [id]);
    res.json({ message: 'Шкаф удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления шкафа' });
  }
});

module.exports = router;