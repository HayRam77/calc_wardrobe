require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Добавляем столбец user_id, если его нет
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='projects' AND column_name='user_id'
        ) THEN
          ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Привязываем существующие проекты без user_id к первому админу (id пользователя с ролью admin)
    await client.query(`
      UPDATE projects SET user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
      WHERE user_id IS NULL
    `);

    await client.query('COMMIT');
    console.log('Миграция проектов выполнена: добавлен user_id, существующие проекты привязаны к админу');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка миграции:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
