import shutil, re
from datetime import datetime

src = 'routes/systemComponentTypes.js'
backup = f'routes/systemComponentTypes.js.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
shutil.copy2(src, backup)
print(f'Бэкап сохранён: {backup}')

with open(src, 'r', encoding='utf-8') as f:
    content = f.read()

insertion = """    const sort = ['id','name','description'].includes(req.query.sort) ? req.query.sort : 'name';
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
"""

content = re.sub(
    r"(router\.get\('/', auth, async \(req, res\) => \{[^}]*?)(const r = await pool\.query\()",
    rf"\1{insertion}    \2",
    content, count=1, flags=re.DOTALL
)

old = "ORDER BY sct.name"
new = "ORDER BY sct.' + sort + ' ' + order"
content = content.replace(old, new)

with open(src, 'w', encoding='utf-8') as f:
    f.write(content)

print('Изменения внесены в routes/systemComponentTypes.js')
