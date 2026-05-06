require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const username = 'admin';
  const plainPassword = 'admin123';
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      console.log(`Пользователь ${username} уже существует.`);
      // Убедимся, что роль admin
      await client.query("UPDATE users SET role = 'admin' WHERE username = $1", [username]);
      console.log('Роль установлена в admin.');
      return;
    }
    const hashed = await bcrypt.hash(plainPassword, 10);
    await client.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')",
      [username, hashed]
    );
    console.log(`Администратор ${username} создан (пароль: ${plainPassword})`);
  } catch (err) {
    console.error('Ошибка создания админа:', err);
  } finally {
    client.release();
    pool.end();
  }
}

createAdmin();
