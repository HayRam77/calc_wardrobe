with open('routes/systemComponentTypes.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = """    const r = await pool.query(`
      SELECT sct.*,
             EXISTS(SELECT 1 FROM system_component_type_materials WHERE type_id = sct.id) as has_materials,
             EXISTS(SELECT 1 FROM system_component_type_blocks WHERE type_id = sct.id) as has_blocks
      FROM system_component_types sct ORDER BY sct.' + sort + ' ' + order
    `);"""

new = """    const r = await pool.query(
      'SELECT sct.*, ' +
      'EXISTS(SELECT 1 FROM system_component_type_materials WHERE type_id = sct.id) as has_materials, ' +
      'EXISTS(SELECT 1 FROM system_component_type_blocks WHERE type_id = sct.id) as has_blocks ' +
      'FROM system_component_types sct ORDER BY sct.' + sort + ' ' + order
    );"""

content = content.replace(old, new)

with open('routes/systemComponentTypes.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('types fix applied')
