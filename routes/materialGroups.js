const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// GET /api/material-groups - получить список всех групп с материалами и привязками
router.get('/', auth, async (req, res) => {
    try {
        const query = `
            SELECT 
                g.*,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'item_id', mgi.id,
                            'material_id', m.id,
                            'name', m.name,
                            'article', m.article,
                            'unit', m.unit,
                            'price', m.price,
                            'ln', m.ln,
                            'tm', m.tm,
                            'quantity', mgi.quantity,
                            'position', mgi.position
                        )
                    ) FILTER (WHERE mgi.id IS NOT NULL), '[]'
                ) as items,
                (
                    SELECT json_build_object(
                        'block_templates', COALESCE((
                            SELECT json_agg(json_build_object('id', bt.id, 'name', bt.name, 'link_id', bmg.id))
                            FROM block_template_material_groups bmg
                            JOIN block_templates bt ON bt.id = bmg.block_template_id
                            WHERE bmg.group_id = g.id
                        ), '[]'::json),
                        'system_component_types', COALESCE((
                            SELECT json_agg(json_build_object('id', sct.id, 'name', sct.name, 'link_id', smg.id))
                            FROM system_component_type_material_groups smg
                            JOIN system_component_types sct ON sct.id = smg.type_id
                            WHERE smg.group_id = g.id
                        ), '[]'::json),
                        'system_components', COALESCE((
                            SELECT json_agg(json_build_object('id', sc.id, 'name', sc.name, 'link_id', scmg.id))
                            FROM system_component_material_groups scmg
                            JOIN system_components sc ON sc.id = scmg.component_id
                            WHERE scmg.group_id = g.id
                        ), '[]'::json),
                        'cabinets', COALESCE((
                            SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'link_id', cmg.id))
                            FROM cabinet_material_groups cmg
                            JOIN cabinets c ON c.id = cmg.cabinet_id
                            WHERE cmg.group_id = g.id
                        ), '[]'::json)
                    )
                ) as bindings
            FROM material_groups g
            LEFT JOIN material_group_items mgi ON mgi.group_id = g.id
            LEFT JOIN materials m ON m.id = mgi.material_id
            GROUP BY g.id
            ORDER BY g.position ASC, g.id ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching material groups:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET /api/material-groups/targets - получить списки доступных объектов для привязки
router.get('/targets', auth, async (req, res) => {
    try {
        const [blockTemplates, sysCompTypes, sysComps, cabinets] = await Promise.all([
            pool.query('SELECT id, name FROM block_templates ORDER BY name ASC'),
            pool.query('SELECT id, name FROM system_component_types ORDER BY name ASC'),
            pool.query('SELECT id, name FROM system_components ORDER BY name ASC'),
            pool.query('SELECT id, name FROM cabinets ORDER BY name ASC')
        ]);
        res.json({
            block_templates: blockTemplates.rows,
            system_component_types: sysCompTypes.rows,
            system_components: sysComps.rows,
            cabinets: cabinets.rows
        });
    } catch (err) {
        console.error('Error fetching targets:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// POST /api/material-groups - создать новую группу
router.post('/', auth, isAdmin, async (req, res) => {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Название группы обязательно' });
    }
    try {
        const posResult = await pool.query('SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM material_groups');
        const nextPos = posResult.rows[0].next_pos;

        const result = await pool.query(
            'INSERT INTO material_groups (name, description, position) VALUES ($1, $2, $3) RETURNING *',
            [name.trim(), description ? description.trim() : null, nextPos]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating material group:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/material-groups/sort-order - сортировка групп
router.put('/sort-order', auth, isAdmin, async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'Неверный формат данных' });
    }
    try {
        for (const item of items) {
            await pool.query('UPDATE material_groups SET position = $1 WHERE id = $2', [item.position, item.id]);
        }
        res.json({ message: 'Порядок сохранён' });
    } catch (err) {
        console.error('Error updating sort order:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/material-groups/:id - редактировать группу
router.put('/:id', auth, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Название группы обязательно' });
    }
    try {
        const result = await pool.query(
            'UPDATE material_groups SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name.trim(), description ? description.trim() : null, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating material group:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/material-groups/:id - удалить группу
router.delete('/:id', auth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM material_groups WHERE id = $1', [id]);
        res.json({ message: 'Группа удалена' });
    } catch (err) {
        console.error('Error deleting material group:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// POST /api/material-groups/:id/items - добавить материал в группу
router.post('/:id/items', auth, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { material_id, quantity } = req.body;
    if (!material_id) {
        return res.status(400).json({ message: 'Укажите материал' });
    }
    const qty = parseFloat(quantity) || 1;
    try {
        const posResult = await pool.query('SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM material_group_items WHERE group_id = $1', [id]);
        const nextPos = posResult.rows[0].next_pos;

        const result = await pool.query(
            'INSERT INTO material_group_items (group_id, material_id, quantity, position) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, material_id, qty, nextPos]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding material to group:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/material-groups/:id/items/:itemId - обновить количество материала
router.put('/:id/items/:itemId', auth, isAdmin, async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = parseFloat(quantity) || 1;
    try {
        const result = await pool.query(
            'UPDATE material_group_items SET quantity = $1 WHERE id = $2 RETURNING *',
            [qty, itemId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating material group item:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/material-groups/:id/items/:itemId - удалить материал из группы
router.delete('/:id/items/:itemId', auth, isAdmin, async (req, res) => {
    const { itemId } = req.params;
    try {
        await pool.query('DELETE FROM material_group_items WHERE id = $1', [itemId]);
        res.json({ message: 'Материал удален из группы' });
    } catch (err) {
        console.error('Error deleting material group item:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/material-groups/:id/clear - очистить группу
router.delete('/:id/clear', auth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM material_group_items WHERE group_id = $1', [id]);
        res.json({ message: 'Группа очищена' });
    } catch (err) {
        console.error('Error clearing material group:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// POST /api/material-groups/:id/bind - привязать группу к объекту
router.post('/:id/bind', auth, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { target_type, target_id } = req.body;

    if (!target_type || !target_id) {
        return res.status(400).json({ message: 'Укажите тип объекта и его ID' });
    }

    try {
        if (target_type === 'block_template') {
            await pool.query(
                'INSERT INTO block_template_material_groups (block_template_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [target_id, id]
            );
        } else if (target_type === 'system_component_type') {
            await pool.query(
                'INSERT INTO system_component_type_material_groups (type_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [target_id, id]
            );
        } else if (target_type === 'system_component') {
            await pool.query(
                'INSERT INTO system_component_material_groups (component_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [target_id, id]
            );
        } else if (target_type === 'cabinet') {
            await pool.query(
                'INSERT INTO cabinet_material_groups (cabinet_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [target_id, id]
            );
        } else {
            return res.status(400).json({ message: 'Неизвестный тип объекта' });
        }
        res.json({ message: 'Привязка успешно создана' });
    } catch (err) {
        console.error('Error binding material group:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/material-groups/:id/bind - отвязать группу от объекта
router.delete('/:id/bind', auth, isAdmin, async (req, res) => {
    const { target_type, link_id } = req.body;

    try {
        if (target_type === 'block_template') {
            await pool.query('DELETE FROM block_template_material_groups WHERE id = $1', [link_id]);
        } else if (target_type === 'system_component_type') {
            await pool.query('DELETE FROM system_component_type_material_groups WHERE id = $1', [link_id]);
        } else if (target_type === 'system_component') {
            await pool.query('DELETE FROM system_component_material_groups WHERE id = $1', [link_id]);
        } else if (target_type === 'cabinet') {
            await pool.query('DELETE FROM cabinet_material_groups WHERE id = $1', [link_id]);
        } else {
            return res.status(400).json({ message: 'Неизвестный тип объекта' });
        }
        res.json({ message: 'Привязка удалена' });
    } catch (err) {
        console.error('Error unbinding material group:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;