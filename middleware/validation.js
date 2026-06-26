const { body } = require('express-validator');

const validate = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Ошибка валидации', details: errors.array() });
    }
    next();
};

const rules = {
    project: {
        create: [
            body('name').trim().notEmpty().withMessage('Название проекта обязательно').isLength({ min: 2, max: 255 }),
            body('description').optional().trim().isLength({ max: 1000 })
        ]
    },
    cabinet: {
        create: [
            body('name').trim().notEmpty().withMessage('Название шкафа обязательно').isLength({ min: 2, max: 255 }),
            body('project_id').isInt().withMessage('ID проекта должен быть числом')
        ]
    },
    auth: {
        login: [
            body('username').trim().notEmpty().withMessage('Имя пользователя обязательно'),
            body('password').notEmpty().withMessage('Пароль обязателен')
        ],
        register: [
            body('username').trim().isLength({ min: 3, max: 50 }),
            body('email').isEmail().normalizeEmail(),
            body('password').isLength({ min: 6 })
        ]
    }
};

module.exports = { validate, rules };
