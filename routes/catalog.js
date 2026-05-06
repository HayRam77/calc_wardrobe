const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/motors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM motors ORDER BY power_kw');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/heaters', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM heaters ORDER BY power_kw');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/breakers', async (req, res) => {
  try {
    const { poles } = req.query;
    let query = 'SELECT * FROM breakers';
    const params = [];
    if (poles) {
      query += ' WHERE poles = $1';
      params.push(poles);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/thermal-relays', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM thermal_relays ORDER BY min_current_a');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cables', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cables ORDER BY cross_section_mm2');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
