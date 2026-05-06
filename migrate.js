require('dotenv').config();
const pool = require('./db');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS motors (
        id SERIAL PRIMARY KEY,
        power_kw NUMERIC(5,2) NOT NULL,
        efficiency NUMERIC(3,2) NOT NULL,
        cos_phi NUMERIC(3,2) NOT NULL,
        start_current_ratio NUMERIC(3,1) NOT NULL,
        poles INTEGER DEFAULT 4,
        voltage VARCHAR(10) DEFAULT '380',
        description VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS heaters (
        id SERIAL PRIMARY KEY,
        power_kw NUMERIC(5,2) NOT NULL,
        voltage VARCHAR(10) DEFAULT '380',
        description VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS breakers (
        id SERIAL PRIMARY KEY,
        current_a INTEGER NOT NULL,
        type VARCHAR(5) DEFAULT 'C',
        poles INTEGER DEFAULT 3
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS thermal_relays (
        id SERIAL PRIMARY KEY,
        min_current_a NUMERIC(5,2) NOT NULL,
        max_current_a NUMERIC(5,2) NOT NULL,
        model VARCHAR(100)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cables (
        id SERIAL PRIMARY KEY,
        cross_section_mm2 NUMERIC(5,2) NOT NULL,
        max_current_a INTEGER NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        voltage VARCHAR(10) DEFAULT '380',
        simultaneity_factor NUMERIC(3,2) DEFAULT 0.90,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_motors (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        motor_id INTEGER REFERENCES motors(id),
        cable_length_m NUMERIC(6,2),
        quantity INTEGER DEFAULT 1
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_heaters (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        heater_id INTEGER REFERENCES heaters(id),
        cable_length_m NUMERIC(6,2),
        quantity INTEGER DEFAULT 1
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_results (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        total_current NUMERIC(6,2),
        main_breaker_current INTEGER,
        uzo_current INTEGER,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
};

createTables();