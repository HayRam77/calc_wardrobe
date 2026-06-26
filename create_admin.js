const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function createAdmin() {
    const username = 'admin';
    const email = 'admin@calc.ru';
    const password = 'admin123'; // смените после входа
    const role = 'admin';

    try {
        // Проверяем, существует ли уже
        const check = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
        
        if (check.rows.length > 0) {
            console.log('Админ уже существует. Обновляем пароль...');
            const salt = await bcrypt.genSalt(12);
            const hash = await bcrypt.hash(password, salt);
            await pool.query('UPDATE users SET password_hash = $1, role = $2 WHERE username = $3', [hash, role, username]);
            console.log('✅ Пароль админа обновлён!');
        } else {
            const salt = await bcrypt.genSalt(12);
            const hash = await bcrypt.hash(password, salt);
            await pool.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                [username, email, hash, role]
            );
            console.log('✅ Админ создан!');
        }
        
        console.log('Логин: admin');
        console.log('Пароль: admin123');
        
    } catch (err) {
        console.error('Ошибка:', err.message);
    } finally {
        process.exit();
    }
}

createAdmin();
