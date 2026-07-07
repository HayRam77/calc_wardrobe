const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`SELECT sc.*, sct.name as type_name, m.name as manufacturer_name, sm.name as module_name FROM system_components sc LEFT JOIN system_component_types sct ON sc.type_id = sct.id LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id LEFT JOIN system_modules sm ON sc.module_id = sm.id ORDER BY sc.name`);
        const components = result.rows;
        for (let i = 0; i < components.length; i++) {
            const paramsResult = await pool.query(`SELECT scp.*, p.name as parameter_name FROM system_component_params scp JOIN system_parameters p ON scp.parameter_id = p.id WHERE scp.component_id = $1`, [components[i].id]);
            components[i].params = paramsResult.rows;
        }
        res.json(components);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(`SELECT sc.*, sct.name as type_name, m.name as manufacturer_name, sm.name as module_name FROM system_components sc LEFT JOIN system_component_types sct ON sc.type_id = sct.id LEFT JOIN manufacturers m ON sc.manufacturer_id = m.id LEFT JOIN system_modules sm ON sc.module_id = sm.id WHERE sc.id = $1`, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
        const comp = result.rows[0];
        const paramsResult = await pool.query(`SELECT scp.*, p.name as parameter_name FROM system_component_params scp JOIN system_parameters p ON scp.parameter_id = p.id WHERE scp.component_id = $1`, [req.params.id]);
        comp.params = paramsResult.rows;
        res.json(comp);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { name, type_id, module_id, manufacturer_id, article, description, ln, tm, params } = req.body;
        const result = await client.query(`INSERT INTO system_components (name, type_id, module_id, manufacturer_id, article, description, ln, tm) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [name, type_id||null, module_id||null, manufacturer_id||null, article||null, description||null, ln||null, tm||null]);
        const newComp = result.rows[0];
        if (params && params.length) for (const p of params) await client.query('INSERT INTO system_component_params (component_id, parameter_id, value, type) VALUES ($1,$2,$3,$4)', [newComp.id, p.parameter_id, p.value||null, p.type||null]);
        await client.query('COMMIT');
        res.status(201).json(newComp);
    } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка' }); }
    finally { client.release(); }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { name, type_id, module_id, manufacturer_id, article, description, ln, tm, params } = req.body;
        const result = await client.query(`UPDATE system_components SET name=$1, type_id=$2, module_id=$3, manufacturer_id=$4, article=$5, description=$6, ln=$7, tm=$8, updated_at=CURRENT_TIMESTAMP WHERE id=$9 RETURNING *`, [name, type_id||null, module_id||null, manufacturer_id||null, article||null, description||null, ln||null, tm||null, req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Не найден' });
        await client.query('DELETE FROM system_component_params WHERE component_id=$1', [req.params.id]);
        if (params && params.length) for (const p of params) await client.query('INSERT INTO system_component_params (component_id, parameter_id, value, type) VALUES ($1,$2,$3,$4)', [req.params.id, p.parameter_id, p.value||null, p.type||null]);
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка' }); }
    finally { client.release(); }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
    try { await pool.query('DELETE FROM system_components WHERE id=$1', [req.params.id]); res.json({ message: 'Удалён' }); }
    catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id/blocks', auth, async (req, res) => {
    try {
        const result = await pool.query(`SELECT sbl.*, bt.name, bt.article, bt.ln, bt.tm, ct.name as type_name, m.name as manufacturer_name FROM system_block_links sbl JOIN block_templates bt ON sbl.block_template_id = bt.id LEFT JOIN component_types ct ON bt.type_id = ct.id LEFT JOIN manufacturers m ON bt.manufacturer_id = m.id WHERE sbl.system_component_id=$1 ORDER BY bt.name`, [req.params.id]);
        res.json(result.rows);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/:id/blocks', auth, isAdmin, async (req, res) => {
    try {
        const { block_template_id, quantity } = req.body;
        const result = await pool.query(`INSERT INTO system_block_links (system_component_id, block_template_id, quantity) VALUES ($1,$2,$3) ON CONFLICT (system_component_id, block_template_id) DO UPDATE SET quantity=EXCLUDED.quantity RETURNING *`, [req.params.id, block_template_id, quantity||1]);
        res.status(201).json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.put('/:id/blocks/:blockId', auth, isAdmin, async (req, res) => {
    try {
        const { quantity } = req.body;
        const result = await pool.query('UPDATE system_block_links SET quantity=$1 WHERE system_component_id=$2 AND id=$3 RETURNING *', [quantity, req.params.id, req.params.blockId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Не найдена' });
        res.json(result.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.delete('/:id/blocks/:blockId', auth, isAdmin, async (req, res) => {
    try { await pool.query('DELETE FROM system_block_links WHERE system_component_id=$1 AND id=$2', [req.params.id, req.params.blockId]); res.json({ message: 'Удалён' }); }
    catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/export', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT sc.id, sc.name, sct.name as type, sc.article, m.name as manufacturer, sc.description, sc.ln, sc.tm FROM system_components sc LEFT JOIN system_component_types sct ON sc.type_id=sct.id LEFT JOIN manufacturers m ON sc.manufacturer_id=m.id ORDER BY sc.name');
        const ws = XLSX.utils.json_to_sheet(result.rows);
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Компоненты систем');
        res.setHeader('Content-Disposition','attachment; filename=system_components.xlsx');
        res.send(XLSX.write(wb, { type:'buffer', bookType:'xlsx' }));
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
    try {
        const wb = XLSX.read(req.file.buffer, { type:'buffer' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let imported = 0;
        for (const row of data) {
            try { await pool.query('INSERT INTO system_components (name, article, description, ln, tm) VALUES ($1,$2,$3,$4,$5)', [row['название']||row['name'], row['артикул']||null, row['описание']||null, row['ln']||null, row['tm']||null]); imported++; } catch (e) {}
        }
        res.json({ message: 'Импортировано '+imported+' записей' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});


// Привязать существующий компонент к другой системе (без дублирования)
router.post('/:id/copy-to-system/:systemId', auth, isAdmin, async (req, res) => {
  try {
    const componentId = req.params.id;
    const systemId = req.params.systemId;

    // Проверка существования компонента и системы
    const comp = await pool.query('SELECT id FROM system_components WHERE id = $1', [componentId]);
    if (comp.rows.length === 0) {
      return res.status(404).json({ message: 'Компонент не найден' });
    }
    const sys = await pool.query('SELECT id FROM systems WHERE id = $1', [systemId]);
    if (sys.rows.length === 0) {
      return res.status(404).json({ message: 'Система не найдена' });
    }

    // Добавляем связь компонента с системой
    await pool.query(
      'INSERT INTO system_components_link (system_id, component_id, quantity) VALUES ($1, $2, 1) ON CONFLICT (system_id, component_id) DO UPDATE SET quantity = EXCLUDED.quantity',
      [systemId, componentId]
    );
    res.json({ message: 'Компонент привязан к системе' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка привязки' });
  }
});

// Дублировать компонент системы со всеми связями (параметры, блоки, материалы)
router.post('/:id/duplicate', auth, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sourceId = req.params.id;
    const comp = await client.query('SELECT * FROM system_components WHERE id = $1', [sourceId]);
    if (comp.rows.length === 0) {
      return res.status(404).json({ message: 'Компонент не найден' });
    }
    const c = comp.rows[0];

    // Создаём новый компонент (без article, чтобы избежать конфликта)
    const newComp = await client.query(
      `INSERT INTO system_components (name, type_id, module_id, manufacturer_id, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [c.name, c.type_id, c.module_id, c.manufacturer_id, c.description]
    );
    const newId = newComp.rows[0].id;

    // Копируем LN и TM
    await client.query(
      `INSERT INTO ln_values (entity_type, entity_id, value)
       SELECT 'system_component', $1, value FROM ln_values WHERE entity_type = 'system_component' AND entity_id = $2`,
      [newId, sourceId]
    );
    await client.query(
      `INSERT INTO tm_values (entity_type, entity_id, value)
       SELECT 'system_component', $1, value FROM tm_values WHERE entity_type = 'system_component' AND entity_id = $2`,
      [newId, sourceId]
    );

    // Копируем параметры
    await client.query(
      `INSERT INTO system_component_params (component_id, parameter_id, value, type)
       SELECT $1, parameter_id, value, type FROM system_component_params WHERE component_id = $2`,
      [newId, sourceId]
    );

    // Копируем блоки шкафа
    await client.query(
      `INSERT INTO system_block_links (system_component_id, block_template_id, quantity)
       SELECT $1, block_template_id, quantity FROM system_block_links WHERE system_component_id = $2`,
      [newId, sourceId]
    );

    // Копируем материалы
    await client.query(
      `INSERT INTO system_component_materials (system_component_id, material_id, quantity)
       SELECT $1, material_id, quantity FROM system_component_materials WHERE system_component_id = $2`,
      [newId, sourceId]
    );

    await client.query('COMMIT');
    res.status(201).json({ id: newId, message: 'Компонент дублирован' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка дублирования' });
  } finally {
    client.release();
  }
});
module.exports = router;
