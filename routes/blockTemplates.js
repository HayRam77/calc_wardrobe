// routes/blockTemplates.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Получить все шаблоны блоков с параметрами
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bt.*, 
        ct.name as type_name, 
        m.name as manufacturer_name,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', cpv.id,
            'parameter_id', cpv.param_id,
            'param_name', p.name,
            'param_value', cpv.value
          )) FROM component_param_values cpv
          LEFT JOIN parameters p ON cpv.param_id = p.id
          WHERE cpv.component_id = bt.id),
          '[]'::json
        ) as parameters
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      ORDER BY bt.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шаблонов блоков' });
  }
});

// Получить один шаблон
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT bt.*, 
        ct.name as type_name, 
        m.name as manufacturer_name,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', cpv.id,
            'parameter_id', cpv.param_id,
            'param_name', p.name,
            'param_value', cpv.value
          )) FROM component_param_values cpv
          LEFT JOIN parameters p ON cpv.param_id = p.id
          WHERE cpv.component_id = bt.id),
          '[]'::json
        ) as parameters
      FROM block_templates bt
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      WHERE bt.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Шаблон не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения шаблона' });
  }
});

// Создать шаблон с параметрами
router.post('/', auth, isAdmin, async (req, res) => {
  const { 
    name, type_id, manufacturer_id, article, 
    price, labor, weight_grams, power_watts, 
    ln, url, description, parameters 
  } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO block_templates 
       (name, type_id, manufacturer_id, article, price, labor, weight_grams, power_watts, ln, url, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, type_id || null, manufacturer_id || null, article || null, 
       price || null, labor || null, weight_grams || null, power_watts || null, 
       ln || null, url || null, description || null]
    );
    
    const template = result.rows[0];
    
    // Сохраняем параметры
    if (parameters && Array.isArray(parameters)) {
      for (const param of parameters) {
        if (param.parameter_id) {
          await client.query(
            'INSERT INTO component_param_values (component_id, param_id, value) VALUES ($1, $2, $3)',
            [template.id, param.parameter_id, param.param_value || param.value || '']
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json(template);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания шаблона' });
  } finally {
    client.release();
  }
});

// Обновить шаблон с параметрами
router.put('/:id', auth, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { parameters, ...bodyFields } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const allowedFields = [
      'name', 'type_id', 'manufacturer_id', 'article', 
      'price', 'labor', 'weight_grams', 'power_watts', 
      'ln', 'url', 'description'
    ];
    
    const fields = [];
    const values = [];
    let counter = 1;
    
    for (const field of allowedFields) {
      if (bodyFields[field] !== undefined) {
        fields.push(`${field} = $${counter++}`);
        values.push(bodyFields[field]);
      }
    }
    
    let result;
    if (fields.length > 0) {
      values.push(id);
      result = await client.query(
        `UPDATE block_templates SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *`,
        values
      );
    } else {
      result = await client.query('SELECT * FROM block_templates WHERE id = $1', [id]);
    }
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Шаблон не найден' });
    }
    
    // Обновляем параметры: удаляем старые, вставляем new
    await client.query('DELETE FROM component_param_values WHERE component_id = $1', [id]);
    
    if (parameters && Array.isArray(parameters)) {
      for (const param of parameters) {
        if (param.parameter_id) {
          await client.query(
            'INSERT INTO component_param_values (component_id, param_id, value) VALUES ($1, $2, $3)',
            [id, param.parameter_id, param.param_value || param.value || '']
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления шаблона' });
  } finally {
    client.release();
  }
});

// Удалить шаблон
router.delete('/:id', auth, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM component_param_values WHERE component_id = $1', [id]);
    await pool.query('DELETE FROM block_templates WHERE id = $1', [id]);
    res.json({ message: 'Шаблон удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления шаблона' });
  }
});

module.exports = router;
