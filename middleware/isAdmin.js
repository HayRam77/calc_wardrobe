const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Требуется авторизация',
            code: 'AUTH_REQUIRED'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Требуются права администратора',
            code: 'ADMIN_REQUIRED'
        });
    }
    
    next();
};

module.exports = { isAdmin };