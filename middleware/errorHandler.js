/**
 * Глобальный обработчик ошибок
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        user: req.user?.id
    });

    // Ошибка Multer (загрузка файлов)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            error: 'Файл слишком большой',
            maxSize: '5MB'
        });
    }

    // Ошибка PostgreSQL
    if (err.code && err.code.startsWith('23')) {
        return res.status(409).json({
            error: 'Конфликт данных',
            detail: err.detail
        });
    }

    // JWT ошибки
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Недействительный токен'
        });
    }

    // Общая ошибка
    res.status(err.status || 500).json({
        error: err.message || 'Внутренняя ошибка сервера',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = { errorHandler };