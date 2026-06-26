const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'Требуется авторизация',
            code: 'TOKEN_REQUIRED'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Определяем тип ошибки JWT
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: 'Токен истёк',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(403).json({ 
                error: 'Недействительный токен',
                code: 'TOKEN_INVALID'
            });
        }
        
        // Проверяем, что токен содержит необходимые данные
        if (!decoded.id || !decoded.username || !decoded.role) {
            return res.status(403).json({ 
                error: 'Некорректный токен',
                code: 'TOKEN_MALFORMED'
            });
        }
        
        req.user = decoded;
        next();
    });
};

module.exports = { authenticateToken };