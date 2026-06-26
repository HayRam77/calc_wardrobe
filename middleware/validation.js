const { validationResult } = require('express-validator');

/**
 * Middleware-обёртка для выполнения массива валидаций
 * и возврата ошибок в формате JSON при неудаче.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Выполняем все проверки из массива
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break; // можно остановить, если уже есть ошибки
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Возвращаем первую ошибку или все (здесь все)
    res.status(400).json({
      message: 'Ошибка валидации',
      errors: errors.array().map(e => e.msg)
    });
  };
};

module.exports = validate;