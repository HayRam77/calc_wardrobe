const { validationResult } = require('express-validator');

/**
 * Middleware для проверки результатов валидации
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Ошибка валидации',
            details: errors.array()
        });
    }
    next();
};

/**
 * Правила валидации для разных сущностей
 */
const rules = {
    project: {
        create: [
            require('express-validator').body('name')
                .trim()
                .notEmpty().withMessage('Название проекта обязательно')
                .isLength({ min: 2, max: 255 }).withMessage('Название должно быть от 2 до 255 символов'),
            require('express-validator').body('description')
                .optional()
                .trim()
                .isLength({ max: 1000 }).withMessage('Описание слишком длинное')
        ]
    },
    cabinet: {
        create: [
            require('express-validator').body('name')
                .trim()
                .notEmpty().withMessage('Название шкафа обязательно')
                .isLength({ min: 2, max: 255 }).withMessage('Название должно быть от 2 до 255 символов'),
            require('express-validator').body('project_id')
                .isInt().withMessage('ID проекта должен быть числом')
        ]
    },
    auth: {
        login: [
            require('express-validator').body('username')
                .trim()
                .notEmpty().withMessage('Имя пользователя обязательно'),
            require('express-validator').body('password')
                .notEmpty().withMessage('Пароль обязателен')
        ],
        register: [
            require('express-validator').body('username')
                .trim()
                .isLength({ min: 3, max: 50 }).withMessage('Имя пользователя должно быть от 3 до 50 символов')
                .matches(/^[a-zA-Z0-9_]+$/).withMessage('Только буквы, цифры и подчёркивание'),
            require('express-validator').body('email')
                .isEmail().withMessage('Некорректный email')
                .normalizeEmail(),
            require('express-validator').body('password')
                .isLength({ min: 6 }).withMessage('Пароль должен быть минимум 6 символов')
        ]
    }
};

module.exports = { validate, rules };