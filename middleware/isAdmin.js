// middleware/isAdmin.js
module.exports = function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Доступ запрещён: требуется роль администратора' });
};