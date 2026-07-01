const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consumables ORDER BY name');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM consumables WHERE id = $1', [req.params.id]);
        res.json(result.rows[0] || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { name, type, article, manufacturer } = req.body;
        const result = await pool.query(
            'INSERT INTO consumables (name, type, article, manufacturer) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, type, article, manufacturer]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name, type, article, manufacturer } = req.body;
        const result = await pool.query(
            'UPDATE consumables SET name=$1, type=$2, article=$3, manufacturer=$4 WHERE id=$5 RETURNING *',
            [name, type, article, manufacturer, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM consumables WHERE id = $1', [req.params.id]);
        res.json({ message: 'Удалено' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
