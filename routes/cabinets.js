const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { checkOwner } = require('../middleware/ownerCheck');

// Получить все шкафы (свои или все для админа)
router.get('/', async (req, res) => {
    try {
        let query;
        let params = [];
        
        if (req.user.role === 'admin') {
            query = `
                SELECT c.*, p.name as project_name, u.username as owner_name
                FROM cabinets c
                LEFT JOIN projects p ON c.project_id = p.id
                LEFT JOIN users u ON c.user_id = u.id
                ORDER BY c.created_at DESC
            `;
        } else {
            query = `
                SELECT c.*, p.name as project_name
                FROM cabinets c
                LEFT JOIN projects p ON c.project_id = p.id
                WHERE c.user_id = $1
                ORDER BY c.created_at DESC
            `;
            params = [req.user.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching cabinets:', err);
        res.status(500).json({ error: err.message });
    }
});

// Получить конкретный шкаф с блоками (с проверкой владельца)
router.get('/:id', checkOwner('cabinets'), async (req, res) => {
    try {
        const cabinetResult = await pool.query(
            `SELECT c.*, p.name as project_name 
             FROM cabinets c 
             LEFT JOIN projects p ON c.project_id = p.id 
             WHERE c.id = $1`,
            [req.params.id]
        );
        
        if (cabinetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Шкаф не найден' });
        }
        
        const cabinet = cabinetResult.rows[0];
        
        // Получаем блоки шкафа
        const blocksResult = await pool.query(
            `SELECT pb.*, bt.name as template_name, bt.type as template_type
             FROM project_blocks pb
             LEFT JOIN block_templates bt ON pb.template_id = bt.id
             WHERE pb.cabinet_id = $1
             ORDER BY pb.position`,
            [req.params.id]
        );
        
        cabinet.blocks = blocksResult.rows;
        res.json(cabinet);
    } catch (err) {
        console.error('Error fetching cabinet:', err);
        res.status(500).json({ error: err.message });
    }
});

// Создать шкаф (проверяем права на проект)
router.post('/', async (req, res) => {
    try {
        const { name, project_id } = req.body;
        
        // Проверяем, что проект принадлежит пользователю
        const projectCheck = await pool.query(
            'SELECT user_id FROM projects WHERE id = $1',
            [project_id]
        );
        
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Проект не найден' });
        }
        
        if (projectCheck.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Нет прав на этот проект' });
        }
        
        const result = await pool.query(
            'INSERT INTO cabinets (name, project_id, user_id) VALUES ($1, $2, $3) RETURNING *',
            [name, project_id, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating cabinet:', err);
        res.status(500).json({ error: err.message });
    }
});

// Обновить шкаф (с проверкой владельца)
router.put('/:id', checkOwner('cabinets'), async (req, res) => {
    try {
        const { name } = req.body;
        const result = await pool.query(
            'UPDATE cabinets SET name = $1 WHERE id = $2 RETURNING *',
            [name, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating cabinet:', err);
        res.status(500).json({ error: err.message });
    }
});

// Удалить шкаф (с проверкой владельца)
router.delete('/:id', checkOwner('cabinets'), async (req, res) => {
    try {
        await pool.query('DELETE FROM cabinets WHERE id = $1', [req.params.id]);
        res.json({ message: 'Шкаф удалён' });
    } catch (err) {
        console.error('Error deleting cabinet:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
