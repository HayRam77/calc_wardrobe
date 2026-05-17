const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const XLSX = require('xlsx');

router.use(authMiddleware);

// Получить шкаф по ID (доступен автору проекта и админу)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const cabinet = await pool.query(`
      SELECT c.*, p.name AS project_name, p.user_id AS project_owner_id
      FROM cabinets c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1
    `, [id]);
    if (cabinet.rows.length === 0) return res.status(404).json({ error: 'Шкаф не найден' });

    const cab = cabinet.rows[0];
    if (req.user.role !== 'admin' && req.user.userId !== cab.project_owner_id) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    const blocks = await pool.query(`
      SELECT pb.id, pb.block_name, pb.order_index, pb.template_id, pb.quantity,
             bt.article, bt.description AS template_description,
             ct.name AS type_name, m.name AS manufacturer_name,
             COALESCE(json_agg(json_build_object('param_name', pbp.param_name, 'param_value', pbp.param_value))
                      FILTER (WHERE pbp.param_name IS NOT NULL), '[]') AS parameters
      FROM project_blocks pb
      LEFT JOIN block_templates bt ON pb.template_id = bt.id
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      LEFT JOIN project_block_params pbp ON pbp.project_block_id = pb.id
      WHERE pb.cabinet_id = $1
      GROUP BY pb.id, bt.article, bt.description, ct.name, m.name
      ORDER BY pb.order_index
    `, [id]);

    res.json({
      ...cab,
      blocks: blocks.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Экспорт компонентов шкафа в Excel
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const blocks = await pool.query(`
      SELECT pb.block_name, pb.quantity, bt.article, bt.description AS remark,
             ct.name AS type_name, m.name AS manufacturer_name,
             COALESCE(json_agg(json_build_object('param_name', pbp.param_name, 'param_value', pbp.param_value))
                      FILTER (WHERE pbp.param_name IS NOT NULL), '[]') AS parameters
      FROM project_blocks pb
      LEFT JOIN block_templates bt ON pb.template_id = bt.id
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      LEFT JOIN project_block_params pbp ON pbp.project_block_id = pb.id
      WHERE pb.cabinet_id = $1
      GROUP BY pb.id, bt.article, bt.description, ct.name, m.name
      ORDER BY pb.order_index
    `, [id]);

    const rows = blocks.rows.map(b => ({
      'Название': b.block_name,
      'Количество': b.quantity,
      'Тип': b.type_name || '',
      'Производитель': b.manufacturer_name || '',
      'Артикул': b.article || '',
      'Примечание': b.remark || '',
      'Параметры': Array.isArray(b.parameters) && b.parameters.length > 0
        ? b.parameters.map(p => `${p.param_name}=${p.param_value}`).join('; ')
        : ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Компоненты');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="cabinet_components.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Импорт компонентов из Excel в шкаф
router.post('/:id/import', async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || !req.files.file) return res.status(400).json({ error: 'Файл не загружен' });
    const file = req.files.file;
    const workbook = XLSX.read(file.data, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    let added = 0;
    for (const row of data) {
      const blockName = row['Название'] || row['block_name'] || '';
      if (!blockName) continue;
      const quantity = row['Количество'] ? parseInt(row['Количество']) : 1;
      let templateId = null;
      const existing = await pool.query('SELECT id FROM block_templates WHERE name = $1', [blockName]);
      if (existing.rows.length > 0) templateId = existing.rows[0].id;
      await pool.query(
        `INSERT INTO project_blocks (project_id, cabinet_id, template_id, block_name, order_index, quantity)
         SELECT c.project_id, $1, $2, $3, COALESCE((SELECT MAX(order_index)+1 FROM project_blocks WHERE cabinet_id = $1), 0), $4
         FROM cabinets c WHERE c.id = $1
         RETURNING *`,
        [id, templateId, blockName, quantity]
      );
      added++;
    }
    res.json({ added, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
