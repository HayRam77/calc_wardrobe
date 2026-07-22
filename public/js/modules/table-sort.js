// Универсальный модуль: drag-and-drop + сортировка + фильтр
// Использование: initTableSort({ tableId, storageKey, apiUrl, filterColumn, filterTitle })

window.initTableSort = function(opts) {
  var table = document.getElementById(opts.tableId);
  if (!table || table.dataset.sortInit === '1') return;
  table.dataset.sortInit = '1';
  
  var tbody = table.querySelector('tbody');
  var thead = table.querySelector('thead tr');
  if (!tbody || !thead) return;
  
  var storageKey = opts.storageKey || 'table_sort';
  var apiUrl = opts.apiUrl || '';
  var filterKey = opts.filterKey || (storageKey + '_filter');
  var filterColumn = opts.filterColumn || null;
  var filterTitle = opts.filterTitle || 'Фильтр';
  
  // ===== ДАННЫЕ =====
  var allData = [];
  var sortState = JSON.parse(localStorage.getItem(storageKey + '_sort') || '{}');
  var sortKey = sortState.key || null;
  var sortDir = sortState.dir || 'asc';
  var selectedFilters = JSON.parse(localStorage.getItem(filterKey) || '[]');
  
  // ===== ФИЛЬТР =====
  if (filterColumn) {
    var filterTh = thead.querySelector('th[data-sort="' + filterColumn + '"]');
    if (filterTh) {
      filterTh.style.position = 'relative';
      var icon = document.createElement('span');
      icon.id = 'filterIcon_' + opts.tableId;
      icon.style.cssText = 'cursor:pointer;font-size:14px;margin-left:4px;';
      icon.textContent = '\u2699';
      icon.title = filterTitle;
      
      var dropdown = document.createElement('div');
      dropdown.id = 'filterDropdown_' + opts.tableId;
      dropdown.style.cssText = 'display:none;position:absolute;background:#fff;border:1px solid #ccc;border-radius:4px;padding:8px;z-index:1000;max-height:200px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
      
      filterTh.appendChild(icon);
      filterTh.appendChild(dropdown);
      
      icon.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', function() { dropdown.style.display = 'none'; });
      dropdown.addEventListener('click', function(e) { e.stopPropagation(); });
    }
  }
  
  function buildFilterDropdown() {
    if (!filterColumn) return;
    var dd = document.getElementById('filterDropdown_' + opts.tableId);
    if (!dd) return;
    var colIdx = Array.from(thead.querySelectorAll('th')).findIndex(function(th) { return th.dataset.sort === filterColumn; });
    if (colIdx < 0) return;
    var values = {};
    tbody.querySelectorAll('tr[data-id]').forEach(function(tr) {
      var v = (tr.cells[colIdx]?.textContent || '').trim() || '-';
      values[v] = 1;
    });
    dd.innerHTML = Object.keys(values).sort().map(function(v) {
      var ch = selectedFilters.indexOf(v) >= 0 ? ' checked' : '';
      return '<label style="display:block;cursor:pointer;white-space:nowrap;font-size:13px;"><input type="checkbox" class="filter-cb" value="' + v.replace(/"/g, '&quot;') + '"' + ch + '> ' + v + '</label>';
    }).join('');
    dd.querySelectorAll('.filter-cb').forEach(function(cb) {
      cb.addEventListener('change', function() {
        selectedFilters = [];
        dd.querySelectorAll('.filter-cb:checked').forEach(function(c) { selectedFilters.push(c.value); });
        localStorage.setItem(filterKey, JSON.stringify(selectedFilters));
        applyFilter();
        var ic = document.getElementById('filterIcon_' + opts.tableId);
        if (ic) ic.textContent = selectedFilters.length > 0 ? '\u2699\uFE0F' : '\u2699';
      });
    });
  }
  
  function applyFilter() {
    if (!filterColumn) return;
    var colIdx = Array.from(thead.querySelectorAll('th')).findIndex(function(th) { return th.dataset.sort === filterColumn; });
    tbody.querySelectorAll('tr[data-id]').forEach(function(tr) {
      var v = (tr.cells[colIdx]?.textContent || '').trim() || '-';
      tr.style.display = (selectedFilters.length === 0 || selectedFilters.indexOf(v) >= 0) ? '' : 'none';
    });
  }
  
  // ===== СОРТИРОВКА =====
  function applySort(key, dir) {
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
    localStorage.setItem(storageKey + '_order', JSON.stringify(ids));
    thead.querySelectorAll('th').forEach(function(h) { h.classList.remove('sorted-asc', 'sorted-desc'); });
    var th = thead.querySelector('th[data-sort="' + key + '"]');
    if (th) th.classList.add(dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
  }
  
  thead.querySelectorAll('th[data-sort]').forEach(function(th) {
    th.style.cursor = 'pointer';
    th.addEventListener('click', function(e) {
      if (e.target.closest('[id^="filterIcon_"]') || e.target.closest('[id^="filterDropdown_"]')) return;
      var key = this.dataset.sort;
      if (sortKey === key) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
      else { sortKey = key; sortDir = 'asc'; }
      localStorage.setItem(storageKey + '_sort', JSON.stringify({key: sortKey, dir: sortDir}));
      applySort(sortKey, sortDir);
    });
  });
  
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
    localStorage.setItem(storageKey + '_order', JSON.stringify(ids));
    localStorage.removeItem(storageKey + '_sort');
    if (apiUrl) {
      fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: ids }) })
        .catch(function(e) { console.error(e); });
    }
    dragInfo = null;
  });
  
  // ===== ВОССТАНОВЛЕНИЕ ПОРЯДКА =====
  setTimeout(function() {
    var savedOrder = JSON.parse(localStorage.getItem(storageKey + '_order') || '[]');
    if (savedOrder.length > 0) {
      var rows = Array.from(tbody.querySelectorAll('tr[data-id]'));
      var rowMap = {};
      rows.forEach(function(r) { rowMap[parseInt(r.dataset.id)] = r; });
      savedOrder.forEach(function(id) {
        if (rowMap[id]) tbody.appendChild(rowMap[id]);
      });
    }
    if (sortKey) applySort(sortKey, sortDir);
    buildFilterDropdown();
    applyFilter();
  }, 150);
};
