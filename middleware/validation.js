const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    // Выполняем все проверки
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    res.status(400).json({
      message: 'Ошибка валидации',
      errors: errors.array().map(e => e.msg)
    });
  };
};

module.exports = validate;