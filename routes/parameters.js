const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const XLSX = require('xlsx');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parameters ORDER BY name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, unit, type, description } = req.body;
    const result = await pool.query(
      'INSERT INTO parameters (name, unit, type, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, unit, type, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, unit, type, description } = req.body;
    const result = await pool.query(
      'UPDATE parameters SET name=$1, unit=$2, type=$3, description=$4 WHERE id=$5 RETURNING *',
      [name, unit, type, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM parameters WHERE id=$1', [req.params.id]);
    res.json({ message: 'Удалено' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/export', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parameters');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Params');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=parameters.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
