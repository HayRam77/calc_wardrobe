// Универсальный модуль для таблиц: drag-and-drop + сортировка кликом + фильтры
// Использование: initTableUtils({ table, storageKey, apiReorderUrl, filters: [{colIndex, type:'select', options:[...]}] })

window.initTableUtils = function(config) {
    var table = config.table;
    if (!table || table.dataset.utilsInit === '1') return;
    table.dataset.utilsInit = '1';

    var storageKey = config.storageKey || 'table_sort';
    var apiReorderUrl = config.apiReorderUrl;
    var thead = table.querySelector('thead tr');
    var tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    // === СОРТИРОВКА ПО КЛИКУ (с сохранением в localStorage) ===
    var sortState = JSON.parse(localStorage.getItem(storageKey) || '{}');
    var sortKey = sortState.key || null;
    var sortDir = sortState.dir || 'asc';

    function applySort(key, dir) {
        if (!tbody || !key) return;
        var rows = Array.from(tbody.querySelectorAll('tr'));
        var colIdx = Array.from(thead.querySelectorAll('th')).findIndex(function(th) { return th.dataset.sort === key; });
        if (colIdx < 0) return;
        rows.sort(function(a, b) {
            var va = (a.cells[colIdx]?.textContent || '').trim();
            var vb = (b.cells[colIdx]?.textContent || '').trim();
            var na = parseFloat(va.replace(/,/g, '.'));
            var nb = parseFloat(vb.replace(/,/g, '.'));
            if (!isNaN(na) && !isNaN(nb)) return dir === 'asc' ? na - nb : nb - na;
            return dir === 'asc' ? va.localeCompare(vb, 'ru') : vb.localeCompare(va, 'ru');
        });
        rows.forEach(function(row) { tbody.appendChild(row); });
        thead.querySelectorAll('th').forEach(function(th) {
            th.classList.remove('sorted-asc', 'sorted-desc');
            if (th.dataset.sort === key) th.classList.add(dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
        });
    }

    thead.querySelectorAll('th[data-sort]').forEach(function(th) {
        th.style.cursor = 'pointer';
        th.addEventListener('click', function() {
            var key = this.dataset.sort;
            if (sortKey === key) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
            else { sortKey = key; sortDir = 'asc'; }
            localStorage.setItem(storageKey, JSON.stringify({key: sortKey, dir: sortDir}));
            applySort(sortKey, sortDir);
        });
    });

    // Применяем сохранённую сортировку при загрузке
    if (sortKey) setTimeout(function() { applySort(sortKey, sortDir); }, 200);

    // === DRAG-AND-DROP ===
    if (apiReorderUrl) {
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

            // Сброс сортировки при перетаскивании
            localStorage.removeItem(storageKey);
            sortKey = null; sortDir = 'asc';

            var items = [];
            tbody.querySelectorAll('tr').forEach(function(tr) {
                var id = tr.dataset.id;
                if (id) items.push({ id: parseInt(id), position: idx });
            });
            fetch(apiReorderUrl, {
                method: config.method || 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: items })
            }).catch(function(e) { console.error(e); });
        });
    }

    // === ФИЛЬТРЫ ===
    if (config.filters && config.filters.length) {
        config.filters.forEach(function(filter) {
            var th = thead.querySelectorAll('th')[filter.colIndex];
            if (!th) return;

            // Создаём иконку фильтра
            var filterIcon = document.createElement('span');
            filterIcon.textContent = ' ▽';
            filterIcon.style.cssText = 'cursor:pointer;font-size:11px;margin-left:4px;';
            filterIcon.title = 'Фильтр';
            th.appendChild(filterIcon);

            // Выпадающий список
            var dropdown = document.createElement('div');
            dropdown.style.cssText = 'display:none;position:absolute;background:white;border:1px solid #ccc;border-radius:4px;padding:8px;z-index:1000;max-height:200px;overflow-y:auto;min-width:150px;box-shadow:0 4px 8px rgba(0,0,0,0.2);';
            th.style.position = 'relative';
            th.appendChild(dropdown);

            var storageFilterKey = storageKey + '_filter_' + filter.colIndex;
            var selectedValues = JSON.parse(localStorage.getItem(storageFilterKey) || '[]');

            function buildDropdown() {
                dropdown.innerHTML = '';
                var values = [];
                tbody.querySelectorAll('tr').forEach(function(tr) {
                    var val = (tr.cells[filter.colIndex]?.textContent || '').trim();
                    if (val && values.indexOf(val) === -1) values.push(val);
                });
                values.sort();
                values.forEach(function(v) {
                    var label = document.createElement('label');
                    label.style.cssText = 'display:block;font-size:13px;cursor:pointer;padding:2px 0;';
                    label.innerHTML = '<input type="checkbox" value="' + v.replace(/"/g, '&quot;') + '" ' + (selectedValues.indexOf(v) !== -1 ? 'checked' : '') + '> ' + v;
                    dropdown.appendChild(label);
                });
            }

            filterIcon.addEventListener('click', function(e) {
                e.stopPropagation();
                if (dropdown.style.display === 'none') { buildDropdown(); dropdown.style.display = 'block'; }
                else { dropdown.style.display = 'none'; }
            });

            dropdown.addEventListener('change', function() {
                selectedValues = [];
                dropdown.querySelectorAll('input:checked').forEach(function(cb) { selectedValues.push(cb.value); });
                localStorage.setItem(storageFilterKey, JSON.stringify(selectedValues));
                applyFilter();
            });

            function applyFilter() {
                tbody.querySelectorAll('tr').forEach(function(tr) {
                    var val = (tr.cells[filter.colIndex]?.textContent || '').trim();
                    if (selectedValues.length === 0 || selectedValues.indexOf(val) !== -1) {
                        tr.style.display = '';
                    } else {
                        tr.style.display = 'none';
                    }
                });
            }

            document.addEventListener('click', function() { dropdown.style.display = 'none'; });
        });
    }
};

// Функция для инициализации таблиц на странице
window.initAllTables = function(configs) {
    configs.forEach(function(c) { window.initTableUtils(c); });
};
