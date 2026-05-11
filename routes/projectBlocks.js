const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Получить все блоки проекта (можно фильтровать по cabinet_id)
router.get('/', async (req, res) => {
  const projectId = req.params.projectId;
  const { cabinet_id } = req.query;
  try {
    let query = 'SELECT * FROM project_blocks WHERE project_id = $1';
    const params = [projectId];
    if (cabinet_id) {
      query += ' AND cabinet_id = $2';
      params.push(cabinet_id);
    }
    query += ' ORDER BY order_index';
    const blocks = await pool.query(query, params);
    const result = [];
    for (const block of blocks.rows) {
      const p = await pool.query(
        'SELECT param_name, param_value FROM project_block_params WHERE project_block_id = $1',
        [block.id]
      );
      result.push({ ...block, parameters: p.rows });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить блок
router.post('/', async (req, res) => {
  const projectId = req.params.projectId;
  const { block_name, template_id, order_index, cabinet_id } = req.body;
  if (!block_name) return res.status(400).json({ error: 'Имя блока обязательно' });
  if (!cabinet_id) return res.status(400).json({ error: 'cabinet_id обязателен' });
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Проверяем существование проекта и шкафа
    const proj = await client.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (proj.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Проект не найден' });
    }
    const cab = await client.query('SELECT id FROM cabinets WHERE id = $1 AND project_id = $2', [cabinet_id, projectId]);
    if (cab.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Шкаф не найден в проекте' });
    }

    let finalTemplateId = template_id || null;

    // Если шаблон не указан, но имя задано, автоматически создаём новый шаблон (библиотеку)
    if (!finalTemplateId && block_name) {
      // Проверим, существует ли уже шаблон с таким именем
      const existing = await client.query('SELECT id FROM block_templates WHERE name = $1', [block_name]);
      if (existing.rows.length > 0) {
        finalTemplateId = existing.rows[0].id;
      } else {
        // Создаём новый шаблон
        const newTmpl = await client.query(
          "INSERT INTO block_templates (name, description, created_by) VALUES ($1, '', $2) RETURNING id",
          [block_name, req.user.userId]
        );
        finalTemplateId = newTmpl.rows[0].id;
        // Параметры не копируем, оставляем пустыми
      }
    }

    // Создаём блок, привязываем к cabinet_id и полученному шаблону
    const blockRes = await client.query(
      'INSERT INTO project_blocks (project_id, cabinet_id, template_id, block_name, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [projectId, cabinet_id, finalTemplateId, block_name, order_index || 0]
    );
    const newBlock = blockRes.rows[0];

    // Если template_id был указан изначально, копируем параметры
    if (finalTemplateId) {
      const params = await client.query(
        'SELECT param_name, param_value FROM block_parameters WHERE template_id = $1 ORDER BY display_order',
        [finalTemplateId]
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
    const blockParams = await pool.query('SELECT param_name, param_value FROM project_block_params WHERE project_block_id = $1', [newBlock.id]);
    res.status(201).json({ ...fullBlock.rows[0], parameters: blockParams.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Такой компонент уже существует' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Обновить название блока и order_index
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

// Обновить параметры блока
router.put('/:blockId/params', async (req, res) => {
  const { parameters } = req.body;
  if (!parameters || !Array.isArray(parameters)) return res.status(400).json({ error: 'parameters должен быть массивом' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM project_block_params WHERE project_block_id = $1', [req.params.blockId]);
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
