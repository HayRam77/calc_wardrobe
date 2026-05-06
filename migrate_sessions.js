require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Добавляем is_blocked, если нет
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='is_blocked'
        ) THEN
          ALTER TABLE users ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT false;
        END IF;
      END $$;
    `);

    // Таблица сессий
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        logout_time TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Миграция сессий выполнена успешно');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка миграции:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
