const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Получить все шаблоны компонентов шкафа
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bt.*, ct.name as type_name, m.name as manufacturer_name
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY bt.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения компонентов' });
  }
});

// Получить один шаблон
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bt.*, ct.name as type_name, m.name as manufacturer_name
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      WHERE bt.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения компонента' });
  }
});

// Создать шаблон
router.post('/', auth, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, url, description, parameters } = req.body;
    
    const result = await client.query(
      `INSERT INTO block_templates (name, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, type_id || null, manufacturer_id || null, article || null, price || null, weight_grams || null, power_watts || null, ln || null, url || null, description || null]
    );
    
    const newBlock = result.rows[0];
    
    // Сохраняем параметры
    if (parameters && parameters.length) {
      for (const p of parameters) {
        await client.query(
          'INSERT INTO block_template_parameters (template_id, parameter_id, value) VALUES ($1, $2, $3)',
          [newBlock.id, p.parameter_id, p.param_value || null]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json(newBlock);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания компонента' });
  } finally {
    client.release();
  }
});

// Обновить шаблон
router.put('/:id', auth, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, url, description } = req.body;
    
    const result = await client.query(
      `UPDATE block_templates 
       SET name = COALESCE($1, name), type_id = COALESCE($2, type_id), manufacturer_id = COALESCE($3, manufacturer_id),
           article = COALESCE($4, article), price = COALESCE($5, price), weight_grams = COALESCE($6, weight_grams),
           power_watts = COALESCE($7, power_watts), ln = COALESCE($8, ln), url = COALESCE($9, url),
           description = COALESCE($10, description)
       WHERE id = $11
       RETURNING *`,
      [name, type_id, manufacturer_id, article, price, weight_grams, power_watts, ln, url, description, req.params.id]
    );
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления компонента' });
  } finally {
    client.release();
  }
});

// Удалить шаблон
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM block_templates WHERE id = $1', [req.params.id]);
    res.json({ message: 'Удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления' });
  }
});

// Экспорт в Excel
router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bt.name as Название, ct.name as Тип, m.name as Производитель, bt.article as Артикул,
             bt.price as Цена, bt.weight_grams as Вес, bt.power_watts as Мощность, bt.ln as LN,
             bt.url as Ссылка, bt.description as Описание
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY bt.name
    `);
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Компоненты');
    res.setHeader('Content-Disposition', 'attachment; filename=block_templates.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка экспорта' });
  }
});

// Импорт из Excel
router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try {
        await pool.query(
          `INSERT INTO block_templates (name, article, price, weight_grams, power_watts, ln, url, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [row['Название'], row['Артикул'] || null, row['Цена'] || null, row['Вес'] || null, 
           row['Мощность'] || null, row['LN'] || null, row['Ссылка'] || null, row['Описание'] || null]
        );
        imported++;
      } catch (e) { console.error(e); }
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка импорта' });
  }
});

module.exports = router;
