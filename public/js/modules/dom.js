// public/js/modules/dom.js
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

export function createTable(columns, data, actions = null) {
  let html = '<div class="table-container"><table class="data-table">';
  html += '<thead><tr>';
  columns.forEach(col => {
    html += `<th>${escapeHtml(col.label)}</th>`;
  });
  if (actions) html += '<th>Действия</th>';
  html += '</tr></thead><tbody>';
  
  if (!data || !data.length) {
    html += `<tr><td colspan="${columns.length + (actions ? 1 : 0)}">Нет данных</td></tr>`;
  } else {
    data.forEach(row => {
      html += '<tr>';
      columns.forEach(col => {
        const value = row[col.key] !== undefined ? row[col.key] : '';
        html += `<td>${escapeHtml(value)}</td>`;
      });
      if (actions) {
        html += `<td>${actions(row)}</td>`;
      }
      html += '</tr>';
    });
  }
  
  html += '</tbody></table></div>';
  return html;
}

export function showError(container, message) {
  container.innerHTML = `<p style="color:red;">${escapeHtml(message)}</p>`;
}

export function showLoading(container) {
  container.innerHTML = '<p>Загрузка...</p>';
}

export function showEmpty(container, message = 'Нет данных') {
  container.innerHTML = `<p>${escapeHtml(message)}</p>`;
}
