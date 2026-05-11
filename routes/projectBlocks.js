const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const XLSX = require('xlsx');

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
    const blockRes = await client.query(
      'INSERT INTO project_blocks (project_id, cabinet_id, template_id, block_name, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [projectId, cabinet_id, template_id || null, block_name, order_index || 0]
    );
    const newBlock = blockRes.rows[0];
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

// Обновить блок
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

// Экспорт блоков шкафа в Excel
router.get('/export', async (req, res) => {
  const projectId = req.params.projectId;
  const { cabinet_id } = req.query;
  if (!cabinet_id) return res.status(400).json({ error: 'cabinet_id обязателен' });
  try {
    const blocks = await pool.query(`
      SELECT pb.block_name, ct.name AS type_name, m.name AS manufacturer_name,
             bt.article, bt.description,
             COALESCE(json_agg(json_build_object('param_name', pbp.param_name, 'param_value', pbp.param_value))
                      FILTER (WHERE pbp.param_name IS NOT NULL), '[]') AS parameters
      FROM project_blocks pb
      LEFT JOIN block_templates bt ON pb.template_id = bt.id
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      LEFT JOIN project_block_params pbp ON pbp.project_block_id = pb.id
      WHERE pb.project_id = $1 AND pb.cabinet_id = $2
      GROUP BY pb.id, ct.name, m.name, bt.article, bt.description
      ORDER BY pb.order_index
    `, [projectId, cabinet_id]);
    const rows = blocks.rows.map(b => ({
      ...b,
      parameters: b.parameters || '[]'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Компоненты шкафа');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="cabinet_components.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Импорт компонентов шкафа из Excel
router.post('/import', async (req, res) => {
  const projectId = req.params.projectId;
  const { cabinet_id } = req.body;
  if (!cabinet_id) return res.status(400).json({ error: 'cabinet_id обязателен' });
  if (!req.files || !req.files.file) return res.status(400).json({ error: 'Файл не загружен' });
  const file = req.files.file;
  const workbook = XLSX.read(file.data, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  let added = 0;
  for (const row of data) {
    const blockName = row.block_name || row['block_name'] || '';
    if (!blockName) continue;
    // Пытаемся найти или создать шаблон
    let templateId = null;
    try {
      const tmpl = await pool.query('SELECT id FROM block_templates WHERE name = $1', [blockName]);
      if (tmpl.rows.length > 0) {
        templateId = tmpl.rows[0].id;
      } else {
        // Создаем новый шаблон (упрощённо, без параметров)
        const newTmpl = await pool.query(
          `INSERT INTO block_templates (name, description, article, type_id, manufacturer_id, created_by)
           VALUES ($1, $2, $3,
                   (SELECT id FROM component_types WHERE name = $4 LIMIT 1),
                   (SELECT id FROM manufacturers WHERE name = $5 LIMIT 1),
                   $6)
           ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
           RETURNING id`,
          [blockName, row.description || null, row.article || null, row.type_name || null, row.manufacturer_name || null, req.user.userId]
        );
        if (newTmpl.rows.length > 0) templateId = newTmpl.rows[0].id;
      }
    } catch (e) {}
    // Вставляем блок
    try {
      await pool.query(
        'INSERT INTO project_blocks (project_id, cabinet_id, template_id, block_name, order_index) VALUES ($1, $2, $3, $4, $5)',
        [projectId, cabinet_id, templateId, blockName, 0]
      );
      added++;
    } catch (e) {}
  }
  res.json({ added, total: data.length });
});

module.exports = router;
