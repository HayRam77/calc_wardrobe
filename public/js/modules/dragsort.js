// Универсальный модуль drag-and-drop + клиентская сортировка
// Использование: initDragAndSort(table, localStorageKey, apiUrl)
// table - DOM элемент table
// localStorageKey - ключ для сохранения сортировки
// apiUrl - URL для сохранения позиций (POST /api/xxx/reorder)

window.initDragAndSort = function(table, storageKey, apiUrl) {
  if (!table || table.dataset.dragInit === '1') return;
  table.dataset.dragInit = '1';
  
  var thead = table.querySelector('thead tr');
  var tbody = table.querySelector('tbody');
  if (!thead || !tbody) return;
  
  // Клиентская сортировка
  var st = JSON.parse(localStorage.getItem(storageKey) || '{}');
  var sk = st.key || null, sd = st.dir || 'asc';
  
  function sort(k, d) {
    if (!tbody || !k) return;
    var rows = Array.from(tbody.querySelectorAll('tr'));
    var ci = Array.from(thead.querySelectorAll('th')).findIndex(function(th) { return th.dataset.sort === k; });
    if (ci < 0) return;
    rows.sort(function(a, b) {
      var va = (a.cells[ci]?.textContent || '').trim();
      var vb = (b.cells[ci]?.textContent || '').trim();
      var na = parseFloat(va.replace(/,/g, '.')), nb = parseFloat(vb.replace(/,/g, '.'));
      if (!isNaN(na) && !isNaN(nb)) return d === 'asc' ? na - nb : nb - na;
      return d === 'asc' ? va.localeCompare(vb, 'ru') : vb.localeCompare(va, 'ru');
    });
    rows.forEach(function(r) { tbody.appendChild(r); });
    thead.querySelectorAll('th').forEach(function(th) {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.sort === k) th.classList.add(d === 'asc' ? 'sorted-asc' : 'sorted-desc');
    });
  }
  
  thead.querySelectorAll('th[data-sort]').forEach(function(th) {
    th.style.cursor = 'pointer';
    th.addEventListener('click', function() {
      var k = this.dataset.sort;
      if (sk === k) { sd = sd === 'asc' ? 'desc' : 'asc'; } else { sk = k; sd = 'asc'; }
      localStorage.setItem(storageKey, JSON.stringify({key: sk, dir: sd}));
      sort(sk, sd);
    });
  });
  
  if (sk) setTimeout(function() { sort(sk, sd); }, 200);
  
  // Drag-and-drop
  var draggedRow = null;
  tbody.addEventListener('dragstart', function(e) {
    var h = e.target.closest('.drag-handle');
    if (!h) { e.preventDefault(); return; }
    draggedRow = h.closest('tr');
    if (draggedRow) draggedRow.style.opacity = '0.5';
  });
  tbody.addEventListener('dragend', function() { if (draggedRow) draggedRow.style.opacity = ''; draggedRow = null; });
  tbody.addEventListener('dragover', function(e) { e.preventDefault(); });
  tbody.addEventListener('drop', function(e) {
    e.preventDefault();
    var tg = e.target.closest('tr');
    if (!tg || !draggedRow || tg === draggedRow) return;
    var rows = Array.from(tbody.querySelectorAll('tr'));
    var from = rows.indexOf(draggedRow), to = rows.indexOf(tg);
    if (from < 0 || to < 0) return;
    if (from < to) tbody.insertBefore(draggedRow, tg.nextSibling);
    else tbody.insertBefore(draggedRow, tg);
    var items = [];
    tbody.querySelectorAll('tr').forEach(function(tr, idx) {
      var id = tr.dataset.id;
      if (id) items.push({ id: parseInt(id), position: idx });
    });
    fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items }) })
    .catch(function(e) { console.error(e); });
  });
};
