// Универсальный модуль: drag-and-drop + сортировка + фильтр + БД + статус-строка
// Использование: initTableSortDB('tableId', 'tableName', 'filterColumn')
// tableId - id таблицы, tableName - имя для API/БД, filterColumn - data-sort столбца с фильтром

window.initTableSortDB = function(tableId, tableName, filterColumn) {
  var table = document.getElementById(tableId);
  if (!table || table.dataset.sortDbInit === '1') return;
  table.dataset.sortDbInit = '1';
  
  var tbody = table.querySelector('tbody');
  var thead = table.querySelector('thead tr');
  if (!tbody || !thead) return;
  
  var storageKey = tableName;
  
  // ===== СОРТИРОВКА ПО КЛИКУ =====
  var sortState = JSON.parse(localStorage.getItem(storageKey + '_sort') || '{}');
  var sortKey = sortState.key || null;
  var sortDir = sortState.dir || 'asc';
  
  thead.querySelectorAll('th[data-sort]').forEach(function(th) {
    th.style.cursor = 'pointer';
    th.addEventListener('click', function(e) {
      if (e.target.closest('[id*=\"FilterIcon\"]') || e.target.closest('[id*=\"Dropdown\"]')) return;
      var key = this.dataset.sort;
      if (sortKey === key) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
      else { sortKey = key; sortDir = 'asc'; }
      localStorage.setItem(storageKey + '_sort', JSON.stringify({key: sortKey, dir: sortDir}));
      sortTable(key, sortDir);
      saveToDB({ sort_key: sortKey, sort_dir: sortDir });
    });
  });
  
  function sortTable(key, dir) {
    var colIdx = Array.from(thead.querySelectorAll('th')).findIndex(function(th) { return th.dataset.sort === key; });
    if (colIdx < 0) return;
    var rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
    rows.sort(function(a, b) {
      var va = (a.cells[colIdx]?.textContent || '').trim();
      var vb = (b.cells[colIdx]?.textContent || '').trim();
      var na = parseFloat(va.replace(/,/g, '.')), nb = parseFloat(vb.replace(/,/g, '.'));
      if (!isNaN(na) && !isNaN(nb)) return dir === 'asc' ? na - nb : nb - na;
      return dir === 'asc' ? va.localeCompare(vb, 'ru') : vb.localeCompare(va, 'ru');
    });
    rows.forEach(function(row) { tbody.appendChild(row); });
    var ids = rows.map(function(r) { return parseInt(r.dataset.id); }).filter(Boolean);
    saveToDB({ sort_order: ids, sort_key: sortKey, sort_dir: dir });
    updateStatusLine(ids);
    thead.querySelectorAll('th').forEach(function(h) { h.classList.remove('sorted-asc', 'sorted-desc'); });
    var th = thead.querySelector('th[data-sort="' + key + '"]');
    if (th) th.classList.add(dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
  }
  
  if (sortKey) setTimeout(function() { sortTable(sortKey, sortDir); }, 200);
  
  // ===== DRAG-AND-DROP =====
  var dragInfo = null;
  tbody.addEventListener('mousedown', function(e) {
    var handle = e.target.closest('.drag-handle');
    if (!handle) return;
    e.preventDefault();
    var row = handle.closest('tr');
    if (!row) return;
    dragInfo = {row: row, startY: e.clientY};
    row.style.opacity = '0.5';
  });
  document.addEventListener('mousemove', function(e) {
    if (!dragInfo) return;
    var rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
    var target = null;
    for (var i = 0; i < rows.length; i++) {
      var rect = rows[i].getBoundingClientRect();
      if (e.clientY > rect.top && e.clientY < rect.bottom) { target = rows[i]; break; }
    }
    if (target && target !== dragInfo.row) {
      var ti = rows.indexOf(target), ri = rows.indexOf(dragInfo.row);
      if (ri < ti) tbody.insertBefore(dragInfo.row, target.nextSibling);
      else tbody.insertBefore(dragInfo.row, target);
    }
  });
  document.addEventListener('mouseup', function() {
    if (!dragInfo) return;
    dragInfo.row.style.opacity = '';
    var ids = [];
    tbody.querySelectorAll('tr[data-id]').forEach(function(tr) { var id = parseInt(tr.dataset.id); if (id) ids.push(id); });
    localStorage.removeItem(storageKey + '_sort');
    saveToDB({ sort_order: ids });
    updateStatusLine(ids);
    dragInfo = null;
  });
  
  // ===== ФИЛЬТР =====
  if (filterColumn) {
    var filterTh = thead.querySelector('th[data-sort="' + filterColumn + '"]');
    if (filterTh) {
      filterTh.style.position = 'relative';
      var icon = filterTh.querySelector('span[id*=\"FilterIcon\"]');
      if (!icon) {
        icon = document.createElement('span');
        icon.id = 'filterIcon_' + tableId;
        icon.style.cssText = 'cursor:pointer;font-size:14px;margin-left:4px;';
        icon.textContent = '\u2699';
        icon.title = 'Фильтр';
        filterTh.appendChild(icon);
      }
      var dropdown = filterTh.querySelector('div[id*=\"Dropdown\"]');
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'filterDropdown_' + tableId;
        dropdown.style.cssText = 'display:none;position:absolute;background:#fff;border:1px solid #ccc;border-radius:4px;padding:8px;z-index:1000;max-height:200px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
        filterTh.appendChild(dropdown);
      }
      
      var selectedFilters = JSON.parse(localStorage.getItem(storageKey + '_filter') || '[]');
      
      icon.addEventListener('click', function(e) { e.stopPropagation(); dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none'; });
      document.addEventListener('click', function() { dropdown.style.display = 'none'; });
      dropdown.addEventListener('click', function(e) { e.stopPropagation(); });
      
      function buildFilter() {
        var colIdx = Array.from(thead.querySelectorAll('th')).findIndex(function(th) { return th.dataset.sort === filterColumn; });
        var values = {};
        tbody.querySelectorAll('tr[data-id]').forEach(function(tr) {
          var v = (tr.cells[colIdx]?.textContent || '').trim() || '-';
          values[v] = 1;
        });
        dropdown.innerHTML = Object.keys(values).sort().map(function(v) {
          var ch = selectedFilters.indexOf(v) >= 0 ? ' checked' : '';
          return '<label style="display:block;cursor:pointer;white-space:nowrap;font-size:13px;"><input type="checkbox" class="filter-cb" value="' + v.replace(/"/g, '&quot;') + '"' + ch + '> ' + v + '</label>';
        }).join('');
        dropdown.querySelectorAll('.filter-cb').forEach(function(cb) {
          cb.addEventListener('change', function() {
            selectedFilters = [];
            dropdown.querySelectorAll('.filter-cb:checked').forEach(function(c) { selectedFilters.push(c.value); });
            localStorage.setItem(storageKey + '_filter', JSON.stringify(selectedFilters));
            applyFilter();
            saveToDB({ filter_data: {} }); // ключ зависит от таблицы
          });
        });
      }
      
      function applyFilter() {
        var colIdx = Array.from(thead.querySelectorAll('th')).findIndex(function(th) { return th.dataset.sort === filterColumn; });
        tbody.querySelectorAll('tr[data-id]').forEach(function(tr) {
          var v = (tr.cells[colIdx]?.textContent || '').trim() || '-';
          tr.style.display = (selectedFilters.length === 0 || selectedFilters.indexOf(v) >= 0) ? '' : 'none';
        });
        icon.textContent = selectedFilters.length > 0 ? '\u2699\uFE0F' : '\u2699';
      }
      
      setTimeout(function() { buildFilter(); applyFilter(); }, 100);
    }
  }
  
  // ===== СТАТУС-СТРОКА =====
  function updateStatusLine(ids) {
    var sl = document.getElementById('sortStatusLine_' + tableId);
    if (!sl) {
      sl = document.createElement('div');
      sl.id = 'sortStatusLine_' + tableId;
      sl.style.cssText = 'margin-top:8px;font-size:12px;color:#555;';
      var tableContainer = table.closest('.table-container');
      if (tableContainer) tableContainer.parentNode.insertBefore(sl, tableContainer.nextSibling);
    }
    sl.textContent = ids.length + ': ' + ids.join(' - ');
  }
  
  // Начальная статус-строка
  setTimeout(function() {
    var ids = [];
    tbody.querySelectorAll('tr[data-id]').forEach(function(tr) { var id = parseInt(tr.dataset.id); if (id) ids.push(id); });
    if (ids.length > 0) updateStatusLine(ids);
  }, 300);
  
  // ===== СОХРАНЕНИЕ В БД =====
  function saveToDB(data) {
    fetch('/api/table-sort/' + tableName, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).catch(function(e) { console.error(e); });
  }
  
  // Загрузка из БД
  fetch('/api/table-sort/' + tableName)
    .then(function(r) { return r.json(); })
    .then(function(saved) {
      if (!saved || !Object.keys(saved).length) return;
      if (saved.sort_order && saved.sort_order.length > 0) {
        var rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
        var rowMap = {};
        rows.forEach(function(r) { rowMap[parseInt(r.dataset.id)] = r; });
        saved.sort_order.forEach(function(id) {
          if (rowMap[id]) tbody.appendChild(rowMap[id]);
        });
        updateStatusLine(saved.sort_order);
      }
    }).catch(function(e) { console.error(e); });
};
