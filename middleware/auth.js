// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ Ошибка: JWT_SECRET не задан в конфигурации окружения (.env)');
    return res.status(500).json({ message: 'Ошибка конфигурации сервера' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Неверный или истекший токен' });
  }
};