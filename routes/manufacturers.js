const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const XLSX = require('xlsx');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Middleware для проверки токена (из заголовка или query)
function checkToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.query.token;
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация', code: 'TOKEN_REQUIRED' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Недействительный токен' });
        req.user = decoded;
        next();
    });
}

router.use(checkToken);

// Получить всех производителей
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM manufacturers ORDER BY COALESCE(position, 9999), name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Создать производителя
router.post('/', async (req, res) => {
  try {
    const { name, country, website } = req.body;
    const result = await pool.query(
      'INSERT INTO manufacturers (name, country, website) VALUES ($1, $2, $3) RETURNING *',
      [name, country, website]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Обновить производителя
router.put('/sort-order', async (req, res) => {
  try {
    var items = req.body.items;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: 'items required' });
    for (var i = 0; i < items.length; i++) {
      var id = parseInt(items[i].id);
      var pos = parseInt(items[i].position);
      if (isNaN(id) || isNaN(pos)) continue;
      await pool.query('UPDATE manufacturers SET position = $1 WHERE id = $2', [pos, id]);
    }
    res.json({ message: 'ok' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Ошибка' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, country, website } = req.body;
    const result = await pool.query(
      'UPDATE manufacturers SET name=$1, country=$2, website=$3 WHERE id=$4 RETURNING *',
      [name, country, website, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Удалить производителя
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM manufacturers WHERE id=$1', [req.params.id]);
    res.json({ message: 'Удалено' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Экспорт в Excel
router.get('/export', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, country, website, created_at FROM manufacturers ORDER BY name');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Производители');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=manufacturers.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Импорт из Excel
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    let imported = 0;
    for (const row of data) {
      if (row.name) {
        await pool.query(
          'INSERT INTO manufacturers (name, country, website) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [row.name, row.country || null, row.website || null]
        );
        imported++;
      }
    }
    res.json({ message: `Импортировано ${imported} записей` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
