require('dotenv').config();
const pool = require('./db');

async function createBlockTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Шаблоны блоков
    await client.query(`
      CREATE TABLE IF NOT EXISTS block_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description VARCHAR(500),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Параметры шаблона
    await client.query(`
      CREATE TABLE IF NOT EXISTS block_parameters (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES block_templates(id) ON DELETE CASCADE,
        param_name VARCHAR(255) NOT NULL,
        param_value TEXT DEFAULT '',
        display_order INTEGER DEFAULT 0
      );
    `);

    // Блоки в проекте (экземпляры)
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_blocks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        template_id INTEGER REFERENCES block_templates(id) ON DELETE SET NULL,
        block_name VARCHAR(255) NOT NULL,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Значения параметров экземпляра
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_block_params (
        id SERIAL PRIMARY KEY,
        project_block_id INTEGER REFERENCES project_blocks(id) ON DELETE CASCADE,
        param_name VARCHAR(255) NOT NULL,
        param_value TEXT DEFAULT ''
      );
    `);

    await client.query('COMMIT');
    console.log('Таблицы универсальных блоков созданы успешно');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка миграции блоков:', err);
  } finally {
    client.release();
    pool.end();
  }
}

createBlockTables();
