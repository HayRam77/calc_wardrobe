with open('public/pages/components-systems-tabs/types-tab.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Замена fetch URL
old = "fetch('/api/system-component-types?_='+Date.now())"
new = "fetch('/api/system-component-types?_='+Date.now()+'&sort='+(JSON.parse(localStorage.getItem('types_sort')||'{}').key||'name')+'&order='+(JSON.parse(localStorage.getItem('types_sort')||'{}').dir||'asc'))"
content = content.replace(old, new)

# 2. Добавление обработчиков после tbody.innerHTML=html;
old_tbody = "tbody.innerHTML=html;"
new_tbody = """tbody.innerHTML=html;
   document.querySelectorAll('#tab-types th[data-sort]').forEach(function(th) {
     th.onclick = function() {
       var k = this.dataset.sort;
       var s = JSON.parse(localStorage.getItem('types_sort') || '{}');
       s.dir = s.key === k ? (s.dir === 'asc' ? 'desc' : 'asc') : 'asc';
       s.key = k;
       localStorage.setItem('types_sort', JSON.stringify(s));
       loadTypes();
     };
   });"""
content = content.replace(old_tbody, new_tbody)

# 3. Замена thead
old_thead = '<thead><tr><th>ID</th><th>Название</th><th>Описание</th>'
new_thead = '<thead><tr><th data-sort="id">ID</th><th data-sort="name">Название</th><th data-sort="description">Описание</th>'
content = content.replace(old_thead, new_thead)

with open('public/pages/components-systems-tabs/types-tab.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('types-tab.html обновлён')
