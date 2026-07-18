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
    const systems = await pool.query(`SELECT s.*, STRING_AGG(DISTINCT c.name, ', ') as cabinet_names, STRING_AGG(DISTINCT c.id::text, ',') as cabinet_ids FROM systems s LEFT JOIN cabinet_systems cs ON cs.system_id = s.id LEFT JOIN cabinets c ON cs.cabinet_id = c.id GROUP BY s.id ORDER BY s.name`);
    const result = [];
    for (const sys of systems.rows) {
      const comps = await pool.query(`
        SELECT scl.*, sc.name, sc.article, sc.ln, sc.tm, sct.name as type_name
        FROM system_components_link scl
        JOIN system_components sc ON scl.component_id = sc.id
        LEFT JOIN system_component_types sct ON sc.type_id = sct.id
        WHERE scl.system_id = $1 ORDER BY scl.position, sc.name
      `, [sys.id]);
      result.push({ ...sys, components: comps.rows });
    }
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/export', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id as ID, name as Название, description as Описание FROM systems ORDER BY id');
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Системы');
    res.setHeader('Content-Disposition', 'attachment; filename=systems.xlsx');
    res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка экспорта' }); }
});

router.post('/import', auth, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let imported = 0;
    for (const row of data) {
      try { await pool.query('INSERT INTO systems (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description=$2', [row['Название'], row['Описание'] || null]); imported++; } catch (e) {}
    }
    res.json({ message: 'Импортировано ' + imported + ' записей' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка импорта' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const sys = await pool.query('SELECT * FROM systems WHERE id = $1', [req.params.id]);
    if (sys.rows.length === 0) return res.status(404).json({ message: 'Не найдена' });
    const comps = await pool.query(`
      SELECT scl.id as link_id, scl.*, sc.id, sc.name, sc.article, sc.type_id, sc.module_id, sc.ln, sc.tm,
             sct.name as type_name, sm.name as module_name
      FROM system_components_link scl
      JOIN system_components sc ON scl.component_id = sc.id
      LEFT JOIN system_component_types sct ON sc.type_id = sct.id
      LEFT JOIN system_modules sm ON sc.module_id = sm.id
      WHERE scl.system_id = $1 ORDER BY scl.position
    `, [req.params.id]);
    res.json({ ...sys.rows[0], components: comps.rows });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, description, cabinet_ids } = req.body;
    const result = await pool.query('INSERT INTO systems (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING *', [name, description || null]);
    const status = result.rows[0].created_at === result.rows[0].updated_at ? 201 : 200;
    const sysId = result.rows[0].id;
    if (cabinet_ids && Array.isArray(cabinet_ids)) {
      for (const cid of cabinet_ids) {
        await pool.query('INSERT INTO cabinet_systems (cabinet_id, system_id) VALUES ($1, $2) ON CONFLICT (cabinet_id, system_id) DO NOTHING', [cid, sysId]);
      }
    }
    res.status(status).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.get('/:id/cabinets', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT cabinet_id FROM cabinet_systems WHERE system_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, components, cabinet_ids } = req.body;
    if (name) await client.query('UPDATE systems SET name=$1, description=$2 WHERE id=$3', [name, description || null, req.params.id]);
    if (cabinet_ids && Array.isArray(cabinet_ids)) {
      await client.query('DELETE FROM cabinet_systems WHERE system_id = $1', [req.params.id]);
      for (const cid of cabinet_ids) {
        await client.query('INSERT INTO cabinet_systems (cabinet_id, system_id) VALUES ($1, $2) ON CONFLICT (cabinet_id, system_id) DO NOTHING', [cid, req.params.id]);
      }
    }
    if (components && Array.isArray(components)) {
      for (const c of components) {
        await client.query('INSERT INTO system_components_link (system_id, component_id, quantity, position) VALUES ($1, $2, $3, (SELECT COALESCE(MAX(position), -1) + 1 FROM system_components_link WHERE system_id = $1)) ON CONFLICT (system_id, component_id) DO UPDATE SET quantity = EXCLUDED.quantity', [req.params.id, c.component_id, c.quantity || 1]);
      }
    }
    await client.query('COMMIT');
    const sys = await pool.query('SELECT * FROM systems WHERE id=$1', [req.params.id]);
    const comps = await pool.query(`
      SELECT scl.*, sc.name, sc.article, sc.ln, sc.tm, sct.name as type_name
      FROM system_components_link scl
      JOIN system_components sc ON scl.component_id = sc.id
      LEFT JOIN system_component_types sct ON sc.type_id = sct.id
      WHERE scl.system_id = $1 ORDER BY scl.position
    `, [req.params.id]);
    res.json({ ...sys.rows[0], components: comps.rows });
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ message: 'Ошибка' }); }
  finally { client.release(); }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
  try { await pool.query('DELETE FROM systems WHERE id=$1', [req.params.id]); res.json({ message: 'Удалена' }); }
  catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Получить связь по ID
router.get('/link/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM system_components_link WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Не найдено' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Обновить связь компонента с системой
router.put('/link/:id', auth, isAdmin, async (req, res) => {
  try {
    const { quantity } = req.body;
    await pool.query('UPDATE system_components_link SET quantity=$1 WHERE id=$2', [quantity, req.params.id]);
    res.json({ message: 'Обновлено' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

// Удалить связь компонента с системой
router.delete('/link/:id', auth, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM system_components_link WHERE id=$1', [req.params.id]);
    res.json({ message: 'Удалено' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});


// Копирование состава системы в другую (привязка компонентов без дублирования)
router.post('/:sourceId/copy-to/:targetId', auth, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sourceId = req.params.sourceId;
    const targetId = req.params.targetId;
    const cabinetId = req.body.cabinetId; // опционально

    // Проверка существования систем
    const sourceSys = await client.query('SELECT id FROM systems WHERE id = $1', [sourceId]);
    const targetSys = await client.query('SELECT id FROM systems WHERE id = $1', [targetId]);
    if (sourceSys.rows.length === 0) {
      return res.status(404).json({ message: 'Исходная система не найдена' });
    }
    if (targetSys.rows.length === 0) {
      return res.status(404).json({ message: 'Целевая система не найдена' });
    }

    // Удаляем все существующие компоненты в целевой системе
    await client.query(
      'DELETE FROM system_components_link WHERE system_id = $1',
      [targetId]
    );

    // Копируем связи компонентов из исходной системы
    const result = await client.query(
      `INSERT INTO system_components_link (system_id, component_id, quantity, position)
       SELECT $2, component_id, quantity, position
       FROM system_components_link
       WHERE system_id = $1`,
      [sourceId, targetId]
    );

    // Если передан cabinetId, привязываем целевую систему к шкафу (если ещё нет)
    if (cabinetId) {
      const existing = await client.query(
        'SELECT id FROM cabinet_systems WHERE cabinet_id = $1 AND system_id = $2',
        [cabinetId, targetId]
      );
      if (existing.rows.length === 0) {
        // Добавляем целевую систему в шкаф
        await client.query(
          'INSERT INTO cabinet_systems (cabinet_id, system_id) VALUES ($1, $2) ON CONFLICT (cabinet_id, system_id) DO NOTHING',
          [cabinetId, targetId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Состав системы скопирован (добавлено/обновлено связей: ' + result.rowCount + ')' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка копирования' });
  } finally {
    client.release();
  }
});

// ========== ОЧИСТКА ВСЕХ КОМПОНЕНТОВ СИСТЕМЫ ==========
router.delete('/:id/components', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM system_components_link WHERE system_id = $1', [id]);
    res.json({ message: 'Система очищена, удалено связей: ' + result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка очистки системы' });
  }
});

module.exports = router;


// Добавить компонент в систему
router.post('/:id/components', auth, isAdmin, async (req, res) => {
    try {
        const { component_id, quantity } = req.body;
        const result = await pool.query(
            `INSERT INTO system_components_link (system_id, component_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (system_id, component_id) 
             DO UPDATE SET quantity = EXCLUDED.quantity
             RETURNING *`,
            [req.params.id, component_id, quantity || 1]
        );
        const status = result.rows[0].created_at === result.rows[0].updated_at ? 201 : 200;
    res.status(status).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка добавления компонента в систему' });
    }
});
