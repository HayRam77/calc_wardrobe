with open('public/pages/components-systems-tabs/components-tab.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Замена fetch URL на динамический с параметрами из localStorage
old_fetch = "fetch('/api/system-components')"
new_fetch = "fetch('/api/system-components?_='+Date.now()+'&sort='+(JSON.parse(localStorage.getItem('components_sort')||'{}').key||'name')+'&order='+(JSON.parse(localStorage.getItem('components_sort')||'{}').dir||'asc'))"
content = content.replace(old_fetch, new_fetch)

# 2. Добавление обработчиков сортировки после tbody.innerHTML=html;
old_tbody = "tbody.innerHTML=html;"
new_tbody = """tbody.innerHTML=html;
   document.querySelectorAll('#tab-components th[data-sort]').forEach(function(th) {
     th.onclick = function() {
       var k = this.dataset.sort;
       var s = JSON.parse(localStorage.getItem('components_sort') || '{}');
       s.dir = s.key === k ? (s.dir === 'asc' ? 'desc' : 'asc') : 'asc';
       s.key = k;
       localStorage.setItem('components_sort', JSON.stringify(s));
       loadComponents();
     };
   });"""
content = content.replace(old_tbody, new_tbody)

# 3. Замена заголовков таблицы на сортируемые
old_thead = '<thead><tr><th>ID</th><th>Модуль системы</th><th>Название</th><th>Тип</th><th>LN</th><th>TM</th><th>Параметры</th><th id="componentsActionsCol" style="display:none;">Действия</th></tr></thead>'
new_thead = '<thead><tr><th data-sort="id">ID</th><th data-sort="module_name">Модуль системы</th><th data-sort="name">Название</th><th data-sort="type_name">Тип</th><th data-sort="ln">LN</th><th data-sort="tm">TM</th><th>Параметры</th><th id="componentsActionsCol" style="display:none;">Действия</th></tr></thead>'
content = content.replace(old_thead, new_thead)

with open('public/pages/components-systems-tabs/components-tab.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('components-tab.html обновлён')
