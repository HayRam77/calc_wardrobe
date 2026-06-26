const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAdmin } = require('../middleware/isAdmin');
const { checkOwner } = require('../middleware/ownerCheck');
const { validate, rules } = require('../middleware/validation');

// ============ БАЗОВЫЕ CRUD ПРОЕКТОВ ============

// Получить все проекты (свои или все для админа)
router.get('/', async (req, res) => {
    try {
        let result;
        if (req.user.role === 'admin' && req.query.all === 'true') {
            result = await pool.query(`
                SELECT p.*, u.username as owner_name
                FROM projects p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
            `);
        } else {
            result = await pool.query(
                'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
                [req.user.id]
            );
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Ошибка получения проектов' });
    }
});

// Получить конкретный проект
router.get('/:id', checkOwner('projects'), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects WHERE id = $1',
            [req.params.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Ошибка получения проекта' });
    }
});

// Создать проект
router.post('/', rules.project.create, validate, async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query(
            'INSERT INTO projects (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
            [name, description, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Ошибка создания проекта' });
    }
});

// Обновить проект
router.put('/:id', checkOwner('projects'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query(
            'UPDATE projects SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [name, description, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Ошибка обновления проекта' });
    }
});

// Удалить проект
router.delete('/:id', checkOwner('projects'), async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
        res.json({ message: 'Проект удалён' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Ошибка удаления проекта' });
    }
});

// ============ ШКАФЫ ПРОЕКТА ============

// Получить все шкафы проекта
router.get('/:projectId/cabinets', checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM cabinets WHERE project_id = $1 ORDER BY created_at DESC',
            [req.params.projectId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching cabinets:', error);
        res.status(500).json({ error: 'Ошибка получения шкафов' });
    }
});

// Создать шкаф в проекте
router.post('/:projectId/cabinets', rules.cabinet.create, validate, checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        const { name } = req.body;
        const result = await pool.query(
            'INSERT INTO cabinets (name, project_id, user_id) VALUES ($1, $2, $3) RETURNING *',
            [name, req.params.projectId, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating cabinet:', error);
        res.status(500).json({ error: 'Ошибка создания шкафа' });
    }
});

// ============ БЛОКИ ПРОЕКТА ============

// Получить все блоки проекта
router.get('/:projectId/blocks', checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT pb.*, bt.name as template_name, bt.type as template_type
             FROM project_blocks pb
             LEFT JOIN block_templates bt ON pb.template_id = bt.id
             WHERE pb.project_id = $1
             ORDER BY pb.position, pb.created_at DESC`,
            [req.params.projectId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching blocks:', error);
        res.status(500).json({ error: 'Ошибка получения блоков' });
    }
});

// Добавить блок в проект
router.post('/:projectId/blocks', checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        const { template_id, cabinet_id, position, params } = req.body;
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Создаём блок
            const blockResult = await client.query(
                `INSERT INTO project_blocks (project_id, template_id, cabinet_id, position) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [req.params.projectId, template_id, cabinet_id, position || 0]
            );
            
            const block = blockResult.rows[0];
            
            // Добавляем параметры блока
            if (params && Array.isArray(params)) {
                for (const param of params) {
                    await client.query(
                        `INSERT INTO project_block_params (block_id, param_id, value) 
                         VALUES ($1, $2, $3)`,
                        [block.id, param.param_id, param.value]
                    );
                }
            }
            
            await client.query('COMMIT');
            
            // Получаем блок с параметрами
            const fullBlock = await client.query(
                `SELECT pb.*, 
                        json_agg(json_build_object(
                            'param_id', pbp.param_id,
                            'value', pbp.value,
                            'param_name', p.name
                        )) as params
                 FROM project_blocks pb
                 LEFT JOIN project_block_params pbp ON pb.id = pbp.block_id
                 LEFT JOIN parameters p ON pbp.param_id = p.id
                 WHERE pb.id = $1
                 GROUP BY pb.id`,
                [block.id]
            );
            
            res.status(201).json(fullBlock.rows[0]);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating block:', error);
        res.status(500).json({ error: 'Ошибка создания блока' });
    }
});

// Удалить блок
router.delete('/:projectId/blocks/:blockId', checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM project_blocks WHERE id = $1 AND project_id = $2 RETURNING *',
            [req.params.blockId, req.params.projectId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Блок не найден' });
        }
        
        res.json({ message: 'Блок удалён' });
    } catch (error) {
        console.error('Error deleting block:', error);
        res.status(500).json({ error: 'Ошибка удаления блока' });
    }
});

module.exports = router;