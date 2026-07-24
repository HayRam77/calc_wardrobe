const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  const secret = process.env.JWT_SECRET || 'CalcWardrobeSecretKey2026!';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Неверный или истекший токен' });
  }
};
