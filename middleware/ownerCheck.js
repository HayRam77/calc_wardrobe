const pool = require('../config/db');

/**
 * Middleware для проверки, что пользователь является владельцем ресурса
 * @param {string} table - Название таблицы
 * @param {string} idField - Название поля ID (по умолчанию 'id')
 * @param {string} ownerField - Название поля владельца (по умолчанию 'user_id')
 */
const checkOwner = (table, idField = 'id', ownerField = 'user_id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[idField] || req.params.id;
            
            if (!resourceId) {
                return res.status(400).json({ error: 'ID ресурса не указан' });
            }

            const result = await pool.query(
                `SELECT ${ownerField} FROM ${table} WHERE ${idField} = $1`,
                [resourceId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Ресурс не найден' });
            }

            // Админы имеют полный доступ
            if (req.user.role === 'admin') {
                return next();
            }

            // Проверяем владельца
            if (result.rows[0][ownerField] !== req.user.id) {
                return res.status(403).json({ 
                    error: 'Нет прав на этот ресурс',
                    code: 'NOT_OWNER'
                });
            }

            next();
        } catch (error) {
            console.error('Owner check error:', error);
            res.status(500).json({ error: 'Ошибка проверки прав' });
        }
    };
};

module.exports = { checkOwner };