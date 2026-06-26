const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { checkOwner } = require('../middleware/ownerCheck');
const { validate, rules } = require('../middleware/validation');

// Получить все шкафы (с информацией о владельце)
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
    } catch (error) {
        console.error('Error fetching cabinets:', error);
        res.status(500).json({ error: 'Ошибка получения шкафов' });
    }
});

// Получить конкретный шкаф с блоками
router.get('/:id', checkOwner('cabinets'), async (req, res) => {
    try {
        // Получаем шкаф
        const cabinetResult = await pool.query(
            'SELECT c.*, p.name as project_name FROM cabinets c LEFT JOIN projects p ON c.project_id = p.id WHERE c.id = $1',
            [req.params.id]
        );
        
        if (cabinetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Шкаф не найден' });
        }
        
        const cabinet = cabinetResult.rows[0];
        
        // Получаем блоки шкафа
        const blocksResult = await pool.query(
            `SELECT pb.*, bt.name as template_name, bt.type as template_type,
                    json_agg(json_build_object(
                        'param_id', pbp.param_id,
                        'value', pbp.value,
                        'param_name', p.name
                    )) FILTER (WHERE pbp.id IS NOT NULL) as params
             FROM project_blocks pb
             LEFT JOIN block_templates bt ON pb.template_id = bt.id
             LEFT JOIN project_block_params pbp ON pb.id = pbp.block_id
             LEFT JOIN parameters p ON pbp.param_id = p.id
             WHERE pb.cabinet_id = $1
             GROUP BY pb.id, bt.name, bt.type
             ORDER BY pb.position`,
            [req.params.id]
        );
        
        cabinet.blocks = blocksResult.rows;
        res.json(cabinet);
    } catch (error) {
        console.error('Error fetching cabinet:', error);
        res.status(500).json({ error: 'Ошибка получения шкафа' });
    }
});

// Создать шкаф
router.post('/', rules.cabinet.create, validate, async (req, res) => {
    try {
        const { name, project_id } = req.body;
        
        // Проверяем права на проект
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
    } catch (error) {
        console.error('Error creating cabinet:', error);
        res.status(500).json({ error: 'Ошибка создания шкафа' });
    }
});

// Обновить шкаф
router.put('/:id', checkOwner('cabinets'), async (req, res) => {
    try {
        const { name } = req.body;
        const result = await pool.query(
            'UPDATE cabinets SET name = $1 WHERE id = $2 RETURNING *',
            [name, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating cabinet:', error);
        res.status(500).json({ error: 'Ошибка обновления шкафа' });
    }
});

// Удалить шкаф
router.delete('/:id', checkOwner('cabinets'), async (req, res) => {
    try {
        // Удаляем блоки шкафа
        await pool.query('DELETE FROM project_blocks WHERE cabinet_id = $1', [req.params.id]);
        // Удаляем сам шкаф
        await pool.query('DELETE FROM cabinets WHERE id = $1', [req.params.id]);
        res.json({ message: 'Шкаф удалён' });
    } catch (error) {
        console.error('Error deleting cabinet:', error);
        res.status(500).json({ error: 'Ошибка удаления шкафа' });
    }
});

module.exports = router;