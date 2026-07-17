with open('routes/systemComponents.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Вставка валидации перед первым const result = await pool.query(
insertion = """        const sort = ['id','name','type_name','manufacturer_name','module_name','ln','tm'].includes(req.query.sort) ? req.query.sort : 'name';
        const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
"""
old = "    try {\n        const result = await pool.query("
new = "    try {\n" + insertion + "        const result = await pool.query("
content = content.replace(old, new, 1)

# Замена ORDER BY sc.name на динамическую (только первый)
content = content.replace("ORDER BY sc.name", "ORDER BY sc.${sort} ${order}", 1)

with open('routes/systemComponents.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('systemComponents.js исправлен')
