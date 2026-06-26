// middleware/ownerCheck.js
const pool = require('../config/db');

/**
 * Проверка владельца проекта.
 * Извлекает id проекта из req.params.id (или req.params.projectId),
 * затем проверяет, что req.user.id совпадает с user_id проекта,
 * либо что пользователь — админ.
 */
const ownerCheck = async (req, res, next) => {
  // Админу разрешено всё
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  const projectId = req.params.id || req.params.projectId;
  if (!projectId) {
    return res.status(400).json({ message: 'Не указан идентификатор проекта' });
  }

  try {
    const result = await pool.query('SELECT user_id FROM projects WHERE id = $1', [projectId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    if (result.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Нет прав на изменение этого проекта' });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при проверке прав' });
  }
};

module.exports = ownerCheck;