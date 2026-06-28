const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ЭКСПОРТ с параметрами в столбцах
router.get('/export', auth, async (req, res) => {
  try {
    const components = await pool.query(`
      SELECT sc.id, sc.name, sc.article, sc.description, sc.url,
             sct.name AS type_name, m.name AS manufacturer_name
      FROM system_components sc
      LEFT JOIN system_component_types sct ON sc.type_id = sct.id
      LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id
      ORDER BY sc.id
    `);
    
    const allParams = await pool.query('SELECT id, name FROM system_parameters ORDER BY id');
    const paramNames = allParams.rows.map(p => p.name);
    
    const result = await Promise.all(components.rows.map(async (comp) => {
      const params = await pool.query(
        `SELECT sp.name, sp.type, scp.value FROM system_component_params scp 
         JOIN system_parameters sp ON scp.parameter_id = sp.id 
         WHERE scp.component_id = $1`, [comp.id]
      );
      const row = {
        ID: comp.id,
        Тип: comp.type_name || '',
        Название: comp.name,
        Производитель: comp.manufacturer_name || '',
        Артикул: comp.article || '',
        Ссылка: comp.url || '',
        Описание: comp.description || ''
      };
      paramNames.forEach(pn => { row[pn] = ''; });
      params.rows.forEach(p => { row[p.name] = p.value || ''; });
      return row;
    }));
    
    const ws = XLSX.utils.json_to_sheet(result);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Компоненты систем');
    res.setHeader('Content-Disposition', 'attachment; filename=system_components.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка экспорта' }); }
});

// ИМПОРТ с параметрами
router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const allParams = await pool.query('SELECT id, name FROM system_parameters');
    const paramMap = {};
    allParams.rows.forEach(p => { paramMap[p.name] = p.id; });
    
    let imported = 0;
    for (const row of data) {
      try {
        const typeRes = await pool.query('SELECT id FROM system_component_types WHERE name = $1', [row['Тип']]);
        const manRes = await pool.query('SELECT id FROM manufacturers WHERE name = $1', [row['Производитель']]);
        
        const compResult = await pool.query(
          `INSERT INTO system_components (name, type_id, manufacturer_id, article, url, description) 
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (article) DO UPDATE SET name=$1, type_id=$2, manufacturer_id=$3, url=$5, description=$6 RETURNING id`,
          [row['Название'] || '', typeRes.rows[0]?.id || null, manRes.rows[0]?.id || null, row['Артикул'] || null, row['Ссылка'] || null, row['Описание'] || null]
        );
        const compId = compResult.rows[0].id;
        
        // Удаляем старые параметры
        await pool.query('DELETE FROM system_component_params WHERE component_id = $1', [compId]);
        
        // Вставляем параметры из всех столбцов, которые есть в paramMap
        for (const key of Object.keys(row)) {
          if (paramMap[key] && row[key]) {
            await pool.query(
              'INSERT INTO system_component_params (component_id, parameter_id, value) VALUES ($1, $2, $3) ON CONFLICT (component_id, parameter_id) DO UPDATE SET value=$3',
              [compId, paramMap[key], String(row[key])]
            );
          }
        }
        imported++;
      } catch (e) { console.error('Ошибка импорта строки:', e); }
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const components = await pool.query(`SELECT sc.*, sct.name AS type_name, sct.id AS type_id, m.name AS manufacturer_name, m.id AS manufacturer_id FROM system_components sc LEFT JOIN system_component_types sct ON sc.type_id = sct.id LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id ORDER BY sc.id`);
    const result = await Promise.all(components.rows.map(async (comp) => {
      const params = await pool.query(`SELECT sp.id, sp.name, sp.type, scp.value FROM system_component_params scp JOIN system_parameters sp ON scp.parameter_id = sp.id WHERE scp.component_id = $1`, [comp.id]);
      return { ...comp, params: params.rows };
    }));
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const comp = await pool.query(`SELECT sc.*, sct.name AS type_name, sct.id AS type_id, m.name AS manufacturer_name, m.id AS manufacturer_id FROM system_components sc LEFT JOIN system_component_types sct ON sc.type_id = sct.id LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id WHERE sc.id = $1`, [req.params.id]);
    if (comp.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
    const params = await pool.query(`SELECT sp.id, sp.name, sp.type, scp.value FROM system_component_params scp JOIN system_parameters sp ON scp.parameter_id = sp.id WHERE scp.component_id = $1`, [req.params.id]);
    res.json({ ...comp.rows[0], params: params.rows });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
  const { name, type_id, manufacturer_id, article, url, description, params } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const compResult = await client.query(`INSERT INTO system_components (name, type_id, manufacturer_id, article, url, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [name, type_id, manufacturer_id || null, article || null, url || null, description || null]);
    if (params && params.length > 0) for (const p of params) await client.query(`INSERT INTO system_component_params (component_id, parameter_id, value) VALUES ($1, $2, $3)`, [compResult.rows[0].id, p.parameter_id, p.value]);
    await client.query('COMMIT');
    res.status(201).json(compResult.rows[0]);
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка' }); }
  finally { client.release(); }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
  const { id } = req.params; const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fields = []; const values = []; let counter = 1;
    for (const field of ['name', 'type_id', 'manufacturer_id', 'article', 'url', 'description']) {
      if (req.body[field] !== undefined) { fields.push(`${field} = $${counter++}`); values.push(req.body[field]); }
    }
    if (fields.length > 0) { values.push(id); await client.query(`UPDATE system_components SET ${fields.join(', ')} WHERE id = $${counter}`, values); }
    if (req.body.params) {
      await client.query('DELETE FROM system_component_params WHERE component_id = $1', [id]);
      for (const p of req.body.params) {
        if (p.type) await client.query('UPDATE system_parameters SET type=$1 WHERE id=$2', [p.type, p.parameter_id]);
        await client.query(`INSERT INTO system_component_params (component_id, parameter_id, value) VALUES ($1, $2, $3)`, [id, p.parameter_id, p.value]);
      }
    }
    await client.query('COMMIT');
    const comp = await pool.query(`SELECT sc.*, sct.name AS type_name, sct.id AS type_id, m.name AS manufacturer_name, m.id AS manufacturer_id FROM system_components sc LEFT JOIN system_component_types sct ON sc.type_id = sct.id LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id WHERE sc.id = $1`, [id]);
    const params = await pool.query(`SELECT sp.id, sp.name, sp.type, scp.value FROM system_component_params scp JOIN system_parameters sp ON scp.parameter_id = sp.id WHERE scp.component_id = $1`, [id]);
    res.json({ ...comp.rows[0], params: params.rows });
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка' }); }
  finally { client.release(); }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try { await pool.query('DELETE FROM system_components WHERE id = $1', [req.params.id]); res.json({ message: 'Удалён' }); }
  catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

module.exports = router;

// ==================== СВЯЗИ С КОМПОНЕНТАМИ ШКАФОВ ====================
// Получить связи для компонента
router.get('/:id/blocks', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sbl.*, bt.name, bt.article, ct.name as type_name, m.name as manufacturer_name
      FROM system_block_links sbl
      JOIN block_templates bt ON sbl.block_template_id = bt.id
      LEFT JOIN component_types ct ON bt.type_id = ct.id
      LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id
      WHERE sbl.system_component_id = $1
      ORDER BY bt.name
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Добавить связь
router.post('/:id/blocks', auth, isAdmin, async (req, res) => {
  try {
    const { block_template_id, quantity } = req.body;
    const result = await pool.query(
      'INSERT INTO system_block_links (system_component_id, block_template_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (system_component_id, block_template_id) DO UPDATE SET quantity=$3 RETURNING *',
      [req.params.id, block_template_id, quantity || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Удалить связь
router.delete('/:id/blocks/:linkId', auth, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM system_block_links WHERE id = $1', [req.params.linkId]);
    res.json({ message: 'Связь удалена' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});
