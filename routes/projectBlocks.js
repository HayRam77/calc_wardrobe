const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Получить все блоки проекта с параметрами
router.get('/', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const blocks = await pool.query(
      'SELECT * FROM project_blocks WHERE project_id = $1 ORDER BY order_index',
      [projectId]
    );
    const result = [];
    for (const block of blocks.rows) {
      const params = await pool.query(
        'SELECT param_name, param_value FROM project_block_params WHERE project_block_id = $1',
        [block.id]
      );
      result.push({ ...block, parameters: params.rows });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить блок в проект (на основе шаблона или пустой)
router.post('/', async (req, res) => {
  const projectId = req.params.projectId;
  const { block_name, template_id, order_index } = req.body;
  if (!block_name) return res.status(400).json({ error: 'Имя блока обязательно' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Проверяем существование проекта
    const proj = await client.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (proj.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Проект не найден' });
    }
    // Создаём блок
    const blockRes = await client.query(
      'INSERT INTO project_blocks (project_id, template_id, block_name, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, template_id || null, block_name, order_index || 0]
    );
    const newBlock = blockRes.rows[0];
    // Если указан шаблон, копируем параметры
    if (template_id) {
      const params = await client.query(
        'SELECT param_name, param_value FROM block_parameters WHERE template_id = $1 ORDER BY display_order',
        [template_id]
      );
      for (const p of params.rows) {
        await client.query(
          'INSERT INTO project_block_params (project_block_id, param_name, param_value) VALUES ($1, $2, $3)',
          [newBlock.id, p.param_name, p.param_value]
        );
      }
    }
    await client.query('COMMIT');
    // Возвращаем созданный блок с параметрами
    const fullBlock = await pool.query('SELECT * FROM project_blocks WHERE id = $1', [newBlock.id]);
    const params = await pool.query('SELECT param_name, param_value FROM project_block_params WHERE project_block_id = $1', [newBlock.id]);
    res.status(201).json({ ...fullBlock.rows[0], parameters: params.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Изменить название блока и/или order_index
router.put('/:blockId', async (req, res) => {
  const { block_name, order_index } = req.body;
  try {
    const result = await pool.query(
      'UPDATE project_blocks SET block_name = COALESCE($1, block_name), order_index = COALESCE($2, order_index) WHERE id = $3 AND project_id = $4 RETURNING *',
      [block_name, order_index, req.params.blockId, req.params.projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Блок не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить блок
router.delete('/:blockId', async (req, res) => {
  try {
    await pool.query('DELETE FROM project_blocks WHERE id = $1 AND project_id = $2', [req.params.blockId, req.params.projectId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить параметры блока
router.get('/:blockId/params', async (req, res) => {
  try {
    const params = await pool.query(
      'SELECT param_name, param_value FROM project_block_params WHERE project_block_id = $1',
      [req.params.blockId]
    );
    res.json(params.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить параметры блока (передаётся массив [{param_name, param_value}])
router.put('/:blockId/params', async (req, res) => {
  const { parameters } = req.body; // массив {param_name, param_value}
  if (!parameters || !Array.isArray(parameters)) return res.status(400).json({ error: 'parameters должен быть массивом' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Удаляем старые параметры
    await client.query('DELETE FROM project_block_params WHERE project_block_id = $1', [req.params.blockId]);
    // Вставляем новые
    for (const p of parameters) {
      await client.query(
        'INSERT INTO project_block_params (project_block_id, param_name, param_value) VALUES ($1, $2, $3)',
        [req.params.blockId, p.param_name, p.param_value]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
