const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { checkOwner } = require('../middleware/ownerCheck');
const { validate, rules } = require('../middleware/validation');
const multer = require('multer');
const XLSX = require('xlsx');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Получить все проекты
router.get('/', async (req, res) => {
    try {
        let result;
        if (req.user.role === 'admin' && req.query.all === 'true') {
            result = await pool.query('SELECT p.*, u.username as owner_name FROM projects p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC');
        } else {
            result = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        }
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: 'Ошибка получения проектов' }); }
});

// Получить проект
router.get('/:id', checkOwner('projects'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: 'Ошибка получения проекта' }); }
});

// Создать проект
router.post('/', rules.project.create, validate, async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query('INSERT INTO projects (name, description, user_id) VALUES ($1, $2, $3) RETURNING *', [name, description, req.user.id]);
        res.status(201).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: 'Ошибка создания проекта' }); }
});

// Обновить проект
router.put('/:id', checkOwner('projects'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query('UPDATE projects SET name=$1, description=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3 RETURNING *', [name, description, req.params.id]);
        res.json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: 'Ошибка обновления проекта' }); }
});

// Удалить проект
router.delete('/:id', checkOwner('projects'), async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
        res.json({ message: 'Проект удалён' });
    } catch (error) { res.status(500).json({ error: 'Ошибка удаления проекта' }); }
});

// Шкафы проекта
router.get('/:projectId/cabinets', checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cabinets WHERE project_id=$1 ORDER BY created_at DESC', [req.params.projectId]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: 'Ошибка получения шкафов' }); }
});

router.post('/:projectId/cabinets', checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        const { name } = req.body;
        const result = await pool.query('INSERT INTO cabinets (name, project_id, user_id) VALUES ($1,$2,$3) RETURNING *', [name, req.params.projectId, req.user.id]);
        res.status(201).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: 'Ошибка создания шкафа' }); }
});

// Блоки проекта
router.get('/:projectId/blocks', checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        const result = await pool.query('SELECT pb.*, bt.name as template_name FROM project_blocks pb LEFT JOIN block_templates bt ON pb.template_id=bt.id WHERE pb.project_id=$1', [req.params.projectId]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: 'Ошибка получения блоков' }); }
});

router.post('/:projectId/blocks', checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        const { template_id, cabinet_id, position, params } = req.body;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const r = await client.query('INSERT INTO project_blocks (project_id,template_id,cabinet_id,position) VALUES ($1,$2,$3,$4) RETURNING *', [req.params.projectId, template_id, cabinet_id, position||0]);
            const block = r.rows[0];
            if (params && Array.isArray(params)) {
                for (const p of params) { await client.query('INSERT INTO project_block_params (block_id,param_id,value) VALUES ($1,$2,$3)', [block.id, p.param_id, p.value]); }
            }
            await client.query('COMMIT');
            res.status(201).json(block);
        } catch(e) { await client.query('ROLLBACK'); throw e; }
        finally { client.release(); }
    } catch (error) { res.status(500).json({ error: 'Ошибка создания блока' }); }
});

router.delete('/:projectId/blocks/:blockId', checkOwner('projects', 'projectId'), async (req, res) => {
    try {
        await pool.query('DELETE FROM project_blocks WHERE id=$1 AND project_id=$2', [req.params.blockId, req.params.projectId]);
        res.json({ message: 'Блок удалён' });
    } catch (error) { res.status(500).json({ error: 'Ошибка удаления блока' }); }
});

// Экспорт
router.get('/export', async (req, res) => {
    try {
        const result = await pool.query('SELECT p.id, p.name, p.description, u.username as owner, p.created_at FROM projects p JOIN users u ON p.user_id=u.id ORDER BY p.id');
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(result.rows), 'Projects');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=projects.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Импорт
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let imported = 0;
        for (const row of data) {
            if (row.name) {
                await pool.query('INSERT INTO projects (name, description, user_id) VALUES ($1,$2,$3)', [row.name, row.description || null, req.user.id]);
                imported++;
            }
        }
        res.json({ message: 'Импортировано ' + imported + ' проектов' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
