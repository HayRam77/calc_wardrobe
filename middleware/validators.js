const { body, param, query } = require('express-validator');

exports.validateProject = [
    body('name').notEmpty().withMessage('Название проекта обязательно'),
    body('description').optional().isString(),
    body('customer').optional().isString(),
    body('status').optional().isIn(['active', 'completed', 'archived']),
];

exports.validateCabinet = [
    body('name').notEmpty().withMessage('Название шкафа обязательно'),
    body('project_id').isInt().withMessage('project_id должен быть числом'),
];

exports.validateSystem = [
    body('name').notEmpty().withMessage('Название системы обязательно'),
];

exports.validateSystemComponent = [
    body('name').notEmpty().withMessage('Название компонента обязательно'),
    body('type_id').optional().isInt(),
];

exports.validateBlockTemplate = [
    body('name').notEmpty().withMessage('Название компонента обязательно'),
    body('type_id').optional().isInt(),
];

exports.validateMaterial = [
    body('name').notEmpty().withMessage('Название материала обязательно'),
    body('manufacturer_id').optional().isInt(),
];

exports.validateManufacturer = [
    body('name').notEmpty().withMessage('Название производителя обязательно'),
];

exports.validatePagination = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

exports.validateId = [
    param('id').isInt().withMessage('ID должен быть числом'),
];
