const express = require('express');
const router = express.Router();
const pool = require('../db');
const isAdmin = require('../middleware/isAdmin');
const bcrypt = require('bcryptjs');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

router.use(isAdmin);

// ---------- пользователи ----------
router.get('/users', async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT u.id, u.username, u.role, u.is_blocked, u.created_at,
        (SELECT COUNT(*) FROM projects WHERE user_id = u.id) AS project_count,
        (SELECT login_time FROM user_sessions WHERE user_id = u.id ORDER BY login_time DESC LIMIT 1) AS last_login
      FROM users u
      ORDER BY u.id
    `);
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await pool.query('SELECT id, username, role, is_blocked, created_at FROM users WHERE id = $1', [req.params.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    const projects = await pool.query('SELECT id, name, voltage, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [req.params.id]);
    const sessions = await pool.query(
      'SELECT login_time, logout_time, ip_address, user_agent FROM user_sessions WHERE user_id = $1 ORDER BY login_time DESC LIMIT 20',
      [req.params.id]
    );
    res.json({ ...user.rows[0], projects: projects.rows, sessions: sessions.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.userId) return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  try {
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [targetId]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.rows[0].role === 'admin') return res.status(403).json({ error: 'Нельзя удалить администратора' });
    await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/block', async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.userId) return res.status(400).json({ error: 'Нельзя заблокировать самого себя' });
  try {
    const user = await pool.query('SELECT is_blocked FROM users WHERE id = $1', [targetId]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    const newState = !user.rows[0].is_blocked;
    await pool.query('UPDATE users SET is_blocked = $1 WHERE id = $2', [newState, targetId]);
    res.json({ is_blocked: newState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Новый пароль должен быть не менее 4 символов' });
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- кабинеты ----------
router.get('/cabinets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.name AS cabinet_name, p.name AS project_name, p.id AS project_id,
             u.username AS creator, c.created_at
      FROM cabinets c
      JOIN projects p ON c.project_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cabinets/:id', async (req, res) => {
  try {
    const cabinet = await pool.query(`
      SELECT c.*, p.name AS project_name, p.id AS project_id,
             u.username AS creator
      FROM cabinets c
      JOIN projects p ON c.project_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (cabinet.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });

    const blocks = await pool.query(`
      SELECT pb.*, 
             (SELECT json_agg(json_build_object('param_name', pbp.param_name, 'param_value', pbp.param_value))
              FROM project_block_params pbp WHERE pbp.project_block_id = pb.id) AS parameters
      FROM project_blocks pb
      WHERE pb.cabinet_id = $1
      ORDER BY pb.order_index
    `, [req.params.id]);

    const result = {
      ...cabinet.rows[0],
      blocks: blocks.rows.map(b => ({
        ...b,
        parameters: b.parameters || []
      }))
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cabinets/:id/move', async (req, res) => {
  const { project_id } = req.body;
  const { id } = req.params;
  if (!project_id) return res.status(400).json({ error: 'Не указан project_id' });
  try {
    const result = await pool.query(
      'UPDATE cabinets SET project_id = $1 WHERE id = $2 RETURNING *',
      [project_id, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cabinets/:id/copy', async (req, res) => {
  const { new_name } = req.body;
  if (!new_name) return res.status(400).json({ error: 'Укажите новое имя' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const original = await client.query('SELECT * FROM cabinets WHERE id = $1', [req.params.id]);
    if (original.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Шкаф не найден' });
    }
    const orig = original.rows[0];
    const copy = await client.query(
      'INSERT INTO cabinets (project_id, name) VALUES ($1, $2) RETURNING *',
      [orig.project_id, new_name]
    );
    const newCabinetId = copy.rows[0].id;
    const blocks = await client.query('SELECT * FROM project_blocks WHERE cabinet_id = $1', [orig.id]);
    for (const block of blocks.rows) {
      const newBlock = await client.query(
        'INSERT INTO project_blocks (project_id, cabinet_id, template_id, block_name, order_index, quantity) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
        [orig.project_id, newCabinetId, block.template_id, block.block_name, block.order_index, block.quantity]
      );
      const params = await client.query('SELECT param_name, param_value FROM project_block_params WHERE project_block_id = $1', [block.id]);
      for (const p of params.rows) {
        await client.query(
          'INSERT INTO project_block_params (project_block_id, param_name, param_value) VALUES ($1,$2,$3)',
          [newBlock.rows[0].id, p.param_name, p.param_value]
        );
      }
    }
    await client.query('COMMIT');
    res.json(copy.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'Шкаф с таким названием уже существует в этом проекте' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/cabinets/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cabinets WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- база данных ----------
router.post('/database/export', async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'bd_calc';
    const dbUser = process.env.DB_USER || 'hrroot';
    const dbPass = process.env.DB_PASSWORD || '';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';

    const dumpFile = path.join('/tmp', 'dump_' + Date.now() + '.sql');
    const env = { PGPASSWORD: dbPass };
    const cmd = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -F p ${dbName} > ${dumpFile}`;
    
    exec(cmd, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('pg_dump error:', stderr);
        return res.status(500).json({ error: 'Ошибка при создании дампа' });
      }
      res.download(dumpFile, path.basename(dumpFile), (err) => {
        if (err) console.error('Download error:', err);
        fs.unlink(dumpFile, () => {});
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/database/import', async (req, res) => {
  try {
    if (!req.files || !req.files.file) return res.status(400).json({ error: 'Файл не загружен' });
    const file = req.files.file;
    const dbName = process.env.DB_NAME || 'bd_calc';
    const dbUser = process.env.DB_USER || 'hrroot';
    const dbPass = process.env.DB_PASSWORD || '';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';

    const tempPath = path.join('/tmp', 'restore_' + Date.now() + '.sql');
    await file.mv(tempPath);

    const env = { PGPASSWORD: dbPass };
    const dropCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;
    
    exec(dropCmd, { env }, (dropErr, dropStdout, dropStderr) => {
      if (dropErr) {
        console.error('Очистка базы не удалась:', dropStderr);
        fs.unlink(tempPath, () => {});
        return res.status(500).json({ error: 'Ошибка при очистке базы данных' });
      }
      const restoreCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${tempPath}`;
      exec(restoreCmd, { env }, (restoreErr, restoreStdout, restoreStderr) => {
        if (restoreErr) {
          console.error('Восстановление не удалось:', restoreStderr);
          fs.unlink(tempPath, () => {});
          return res.status(500).json({ error: 'Ошибка при восстановлении базы данных' });
        }
        // Сбрасываем последовательности
        const resetSeqCmd = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "SELECT setval('user_sessions_id_seq', COALESCE((SELECT MAX(id) FROM user_sessions), 1)); SELECT setval('block_templates_id_seq', COALESCE((SELECT MAX(id) FROM block_templates), 1)); SELECT setval('cabinets_id_seq', COALESCE((SELECT MAX(id) FROM cabinets), 1)); SELECT setval('component_param_values_id_seq', COALESCE((SELECT MAX(id) FROM component_param_values), 1)); SELECT setval('component_types_id_seq', COALESCE((SELECT MAX(id) FROM component_types), 1)); SELECT setval('manufacturers_id_seq', COALESCE((SELECT MAX(id) FROM manufacturers), 1)); SELECT setval('parameters_id_seq', COALESCE((SELECT MAX(id) FROM parameters), 1)); SELECT setval('project_block_params_id_seq', COALESCE((SELECT MAX(id) FROM project_block_params), 1)); SELECT setval('project_blocks_id_seq', COALESCE((SELECT MAX(id) FROM project_blocks), 1)); SELECT setval('projects_id_seq', COALESCE((SELECT MAX(id) FROM projects), 1)); SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));"`;
        exec(resetSeqCmd, { env }, (seqErr, seqStdout, seqStderr) => {
          if (seqErr) console.error('Сброс последовательностей не удался:', seqStderr);
          else console.log('Последовательности сброшены');
          fs.unlink(tempPath, () => {});
          res.json({ success: true, message: 'База данных восстановлена, последовательности синхронизированы' });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
