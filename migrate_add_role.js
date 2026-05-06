require('dotenv').config();
const pool = require('./db');

async function addRoleColumn() {
  const client = await pool.connect();
  try {
    // Добавляем столбец role, если не существует (используем DO block)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='role'
        ) THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
        END IF;
      END $$;
    `);
    console.log('Столбец role добавлен (если отсутствовал)');
    // Установим роль admin для пользователя с id=1 (если есть)
    const res = await client.query("UPDATE users SET role = 'admin' WHERE id = 1 RETURNING username, role");
    if (res.rows.length > 0) {
      console.log(`Пользователь ${res.rows[0].username} теперь ${res.rows[0].role}`);
    } else {
      console.log('Пользователь с id=1 не найден, admin не назначен.');
    }
  } catch (err) {
    console.error('Ошибка миграции:', err);
  } finally {
    client.release();
    pool.end();
  }
}

addRoleColumn();
